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

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
