import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MobileSurveysController } from './mobile-surveys.controller';
import { MobileSurveysService } from './mobile-surveys.service';

@Module({
  controllers: [MobileSurveysController],
  providers: [MobileSurveysService, PrismaService],
})
export class MobileSurveysModule {}
