import { Module } from '@nestjs/common';
import { AudiencesService } from './audiences.service';
import { AudiencesController } from './audiences.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AudiencesController],
  providers: [AudiencesService, PrismaService],
})
export class AudiencesModule {}
