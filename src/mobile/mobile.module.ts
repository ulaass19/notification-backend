import { Module } from "@nestjs/common";
import { MobileStreamController } from "./mobile-stream.controller";
import { MobileDebugController } from "./mobile-debug.controller";

@Module({
  controllers: [MobileStreamController, MobileDebugController],
})
export class MobileModule {}
