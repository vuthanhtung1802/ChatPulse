import { parseCorsOrigins, validateEnvironment } from "./environment";

const validEnvironment = {
  MONGO_URI: "mongodb://localhost/chatpulse",
  JWT_SECRET: "access-secret",
  JWT_REFRESH_SECRET: "refresh-secret",
  CLOUDINARY_CLOUD_NAME: "cloud",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
};

describe("environment configuration", () => {
  it("applies safe development defaults", () => {
    expect(validateEnvironment(validEnvironment)).toMatchObject({
      PORT: "3001",
      JWT_EXPIRES_IN: "15m",
      JWT_REFRESH_EXPIRES_IN: "7d",
      CORS_ORIGINS: "http://localhost:3000",
    });
  });

  it("reports all missing required variables", () => {
    expect(() => validateEnvironment({})).toThrow(
      "Missing required environment variables: MONGO_URI, JWT_SECRET",
    );
  });

  it("parses a comma-separated CORS allowlist", () => {
    expect(
      parseCorsOrigins("https://app.example.com, https://admin.example.com"),
    ).toEqual(["https://app.example.com", "https://admin.example.com"]);
  });
});
