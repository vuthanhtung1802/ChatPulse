import { Module } from "@nestjs/common";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";

@Module({
  providers: [JwtAuthGuard, JwtRefreshGuard],
  exports: [JwtAuthGuard, JwtRefreshGuard],
})
export class SharedModule {}

export { JwtAuthGuard, JwtRefreshGuard };
export { CurrentUser } from "./decorators/current-user.decorator";
