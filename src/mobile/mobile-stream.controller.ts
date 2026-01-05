import { Controller, Sse, UseGuards, Req } from "@nestjs/common";
import { Observable, interval, merge, map } from "rxjs";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationStreamService } from "../notification/realtime/notification-stream.service";

@Controller("mobile")
export class MobileStreamController {
  constructor(private readonly stream: NotificationStreamService) {}

  @UseGuards(JwtAuthGuard)
  @Sse("stream")
  streamForUser(@Req() req: Request): Observable<MessageEvent> {
    const user = req.user as any; // { userId, email }
    const userId = String(user?.userId);
    console.log('[SSE] connected userId =', userId);


    const user$ = this.stream.getSubject(userId).pipe(
      map((event) => ({ data: event } as MessageEvent))
    );

    const ping$ = interval(25000).pipe(
      map(() => ({ data: { type: "ping", at: new Date().toISOString() } } as any))
    );

    return merge(user$, ping$);
  }
}
