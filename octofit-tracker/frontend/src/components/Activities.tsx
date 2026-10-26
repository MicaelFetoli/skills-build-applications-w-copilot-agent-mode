import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

type ActivitiesResponse = {
  activities: Activity[];
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<ActivitiesResponse>('/api/activities')
      .then((response) => {
        if (active) setActivities(response.activities);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load activities');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Activities</h2>
      {loading && <p role="status">Loading activities...</p>}
      {!loading && error && <p role="alert">Error: {error}</p>}
      {!loading && !error && activities.length === 0 && <p>No activities</p>}
      {!loading && !error && activities.length > 0 && (
        <ul>
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${index}`}>
              {activity.type}{activity.minutes !== undefined ? ` - ${activity.minutes} minutes` : ''}
              {activity.points !== undefined ? ` - ${activity.points} points` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
