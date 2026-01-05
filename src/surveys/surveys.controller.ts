import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { PublishSurveyDto } from './dto/publish-survey.dto';

@ApiTags('AdminSurveys')
@Controller('admin/surveys')
export class SurveysController {
  constructor(private readonly service: SurveysService) {}

  @Post()
  create(@Body() dto: CreateSurveyDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSurveyDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/publish')
  publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishSurveyDto,
  ) {
    return this.service.publish(id, dto);
  }

  @Post(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.archive(id);
  }
}
