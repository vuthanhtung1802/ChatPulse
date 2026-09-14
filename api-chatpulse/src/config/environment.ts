const REQUIRED_VARIABLES = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

export type Environment = Record<string, string | undefined>;

export function validateEnvironment(config: Environment): Environment {
  const missing = REQUIRED_VARIABLES.filter((key) => !config[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  return {
    ...config,
    PORT: config.PORT || "3001",
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN || "15m",
    JWT_REFRESH_EXPIRES_IN: config.JWT_REFRESH_EXPIRES_IN || "7d",
    CORS_ORIGINS: config.CORS_ORIGINS || "http://localhost:3000",
  };
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
