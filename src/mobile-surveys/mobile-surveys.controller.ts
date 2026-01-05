import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MobileSurveysService } from './mobile-surveys.service';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('MobileSurveys')
@Controller('mobile/surveys')
@UseGuards(JwtAuthGuard)
export class MobileSurveysController {
  constructor(private readonly service: MobileSurveysService) {}

  private getUserId(req: any) {
    // ✅ Senin JwtStrategy validate() return'üne göre:
    // return { userId: payload.sub, email: payload.email };
    const raw = req?.user?.userId;
    const id = Number(raw);

    if (!Number.isFinite(id) || id <= 0) {
      throw new UnauthorizedException('Geçersiz oturum. Lütfen tekrar giriş yap.');
    }
    return id;
  }

  @Get('active')
  async active(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.service.getActiveSurveyForUser(userId);
  }

  @Get(':id')
  async detail(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    this.getUserId(req); // auth check
    return this.service.getSurveyDetail(id);
  }

  @Post(':id/submit')
  async submit(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitSurveyDto,
  ) {
    const userId = this.getUserId(req);
    return this.service.submit(userId, id, dto);
  }
}
