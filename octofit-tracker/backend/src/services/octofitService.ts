import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function clientError(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw clientError('Valid activity data is required');

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (typeof userId !== 'string' || typeof teamId !== 'string' || typeof type !== 'string' || type.trim() === '') {
    throw clientError('userId, teamId, and type are required');
  }
  if (!/^[a-fA-F0-9]{24}$/.test(userId) || !/^[a-fA-F0-9]{24}$/.test(teamId)) {
    throw clientError('Valid userId and teamId are required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw clientError('minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(new mongoose.Types.ObjectId(userId)).lean(),
    Team.findById(new mongoose.Types.ObjectId(teamId)).lean(),
  ]);
  if (!user || !team) throw clientError('A matching user and team are required');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw clientError('Valid team data is required');

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim() === '') throw clientError('Team name is required');
  if (typeof mascot !== 'string' || mascot.trim() === '') throw clientError('Team mascot is required');

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || memberIds.some((memberId) => typeof memberId !== 'string' || !mongoose.isObjectIdOrHexString(memberId))) {
    throw clientError('Valid team member IDs are required');
  }

  const uniqueMemberIds = [...new Set(memberIds)];
  const existingMembers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id').lean();
  if (existingMembers.length !== uniqueMemberIds.length) throw clientError('All team members must exist');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMemberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);

  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: decodeURIComponent(userEmail) }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = recentActivity?.type === 'run'
    ? 'endurance'
    : recentActivity?.type === 'cycle'
      ? 'endurance'
      : recentActivity?.type;
  const focus = activityFocus || user.fitnessGoal;

  const matchingWorkout = await Workout.findOne({ focus }).lean();
  const fallbackWorkout = matchingWorkout ? null : await Workout.findOne().lean();
  const workout = matchingWorkout ?? fallbackWorkout;
  if (!workout) return [];

  const reason = recentActivity?.type
    ? `Matches your recent ${recentActivity.type} activity and ${focus} goal`
    : `Matches your ${focus} fitness goal and activity preferences`;

  return [{ ...workout, reason }];
}

export { User };
