import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackEventDto {
  @ApiProperty({ example: 'screen_view' })
  @IsString()
  event!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ example: 'home' })
  @IsOptional()
  @IsString()
  screen?: string;

  @ApiPropertyOptional({ example: 'tap_create_expense' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'ios' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class TrackBatchDto {
  @ApiProperty({ type: [TrackEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  events!: TrackEventDto[];
}
