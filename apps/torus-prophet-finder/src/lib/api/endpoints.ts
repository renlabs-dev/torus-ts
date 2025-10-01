// Centralized API endpoints for the Memory service (staging)
// Hardcoded by design, to avoid repetition across the app.

export const MEMORY_API_BASE_URL =
  "https://memory.sension.torus.directory" as const;

export const PROPHET_FINDER_STATS_URL =
  `${MEMORY_API_BASE_URL}/api/prophet-finder/stats` as const;

export const PROPHET_FINDER_PROFILES_URL =
  `${MEMORY_API_BASE_URL}/api/prophet-finder/profiles` as const;

// Tasks endpoints (staging)
export const TASKS_INSERT_URL =
  `${MEMORY_API_BASE_URL}/api/tasks/insert` as const;
