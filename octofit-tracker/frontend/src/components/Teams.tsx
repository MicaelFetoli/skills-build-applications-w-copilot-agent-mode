import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name?: string; members?: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<TeamsResponse>('/api/teams')
      .then((response) => { if (active) setTeams(response.teams); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load teams');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Teams</h2>
      {loading && <p role="status">Loading teams...</p>}
      {!loading && error && <p role="alert">Error: {error}</p>}
      {!loading && !error && teams.length === 0 && <p>No teams</p>}
      {!loading && !error && teams.length > 0 && (
        <ul>{teams.map((team, index) => <li key={`${team.name}-${index}`}>{team.name}</li>)}</ul>
      )}
    </section>
  );
}
