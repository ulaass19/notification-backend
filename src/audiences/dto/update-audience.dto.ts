import { PartialType } from '@nestjs/mapped-types';
import { CreateAudienceDto } from './create-audience.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateAudienceDto extends PartialType(CreateAudienceDto) {}
