import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser = require("cookie-parser");
import { ConfigService } from "@nestjs/config";
import { parseCorsOrigins } from "./config/environment";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Set global prefix
  app.setGlobalPrefix("api");

  // Enable cookie parser
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: parseCorsOrigins(configService.getOrThrow<string>("CORS_ORIGINS")),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Enable Validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  const port = configService.getOrThrow<number>("PORT");
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);

  // Initialize WebSocket server on the same HTTP server
}
bootstrap();
