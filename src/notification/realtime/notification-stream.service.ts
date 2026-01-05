import { Injectable } from "@nestjs/common";
import { Subject } from "rxjs";

export type StreamEvent =
  | { type: "notification"; id: number | string; title: string; body: string; data?: any }
  | { type: "ping"; at: string };

@Injectable()
export class NotificationStreamService {
  private subjects = new Map<string, Subject<StreamEvent>>();

  getSubject(userId: string) {
    let s = this.subjects.get(userId);
    if (!s) {
      s = new Subject<StreamEvent>();
      this.subjects.set(userId, s);
    }
    return s;
  }

  emitToUser(userId: string, event: StreamEvent) {
    const s = this.subjects.get(userId);
    if (s) s.next(event);
  }
}
