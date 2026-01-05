import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AudiencesService } from './audiences.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Tüm /admin/audiences uçlarını JWT ile koru
@UseGuards(JwtAuthGuard)
@Controller('admin/audiences')
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Post()
  create(@Body() dto: CreateAudienceDto) {
    return this.audiencesService.create(dto);
  }

  @Get()
  findAll() {
    return this.audiencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.audiencesService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAudienceDto) {
    return this.audiencesService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.audiencesService.remove(Number(id));
  }
}
