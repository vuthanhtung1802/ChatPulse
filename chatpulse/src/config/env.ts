function getUrl(
  name: string,
  value: string | undefined,
  fallback: string,
): string {
  const configuredValue = value?.trim() || fallback;
  try {
    return new URL(configuredValue).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }
}

export const API_URL = getUrl(
  "VITE_API_URL",
  import.meta.env.VITE_API_URL,
  "http://localhost:3001/api",
);

export const WS_URL = getUrl(
  "VITE_WS_URL",
  import.meta.env.VITE_WS_URL,
  "http://localhost:3001",
);
