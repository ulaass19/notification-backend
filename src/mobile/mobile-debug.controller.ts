import { Controller, Post, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationStreamService } from "../notification/realtime/notification-stream.service";

@Controller("mobile/debug")
export class MobileDebugController {
  constructor(private readonly stream: NotificationStreamService) {}

  @UseGuards(JwtAuthGuard)
  @Post("demo-notification")
  demo(@Req() req: any) {
    const userId = String(req.user.userId);

    this.stream.emitToUser(userId, {
      type: "notification",
      id: Date.now(),
      title: "DailySpark ✨",
      body: "SSE üzerinden anlık demo bildirimi!",
      data: { screen: "DailyStatus" },
    });

    return { ok: true };
  }
}
