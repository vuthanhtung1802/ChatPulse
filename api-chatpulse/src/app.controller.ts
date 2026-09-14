import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getServiceInfo() {
    return { service: "chatpulse-api", status: "ok" };
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
