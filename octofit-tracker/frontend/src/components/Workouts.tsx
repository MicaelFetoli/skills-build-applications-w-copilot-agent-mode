import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title?: string; reason?: string };
type WorkoutsResponse = { suggestions: Suggestion[] };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<WorkoutsResponse>(`/api/workouts/suggestions/${userEmail}`)
      .then((response) => { if (active) setSuggestions(response.suggestions); })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load workout suggestions');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Workout suggestions</h2>
      {loading && <p role="status">Loading workout suggestions...</p>}
      {!loading && error && <p role="alert">Error: {error}</p>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions</p>}
      {!loading && !error && suggestions.length > 0 && (
        <ul>{suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`}>
            {suggestion.title}{suggestion.reason ? ` - ${suggestion.reason}` : ''}
          </li>
        ))}</ul>
      )}
    </section>
  );
}
