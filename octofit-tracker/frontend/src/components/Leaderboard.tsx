import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then((response) => { if (active) setEntries(response.leaderboard); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load leaderboard');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Leaderboard</h2>
      {loading && <p role="status">Loading leaderboard...</p>}
      {!loading && error && <p role="alert">Error: {error}</p>}
      {!loading && !error && entries.length === 0 && <p>No leaderboard scores</p>}
      {!loading && !error && entries.length > 0 && (
        <ol>{entries.map((entry, index) => (
          <li key={`${entry.teamName}-${index}`}>{entry.teamName} - {entry.totalPoints} points</li>
        ))}</ol>
      )}
    </section>
  );
}
