import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsJSON,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ── Promotional Banners ─────────────────────────────────────────────────

const BANNER_STATUSES = ['Draft', 'Active', 'Inactive', 'Expired'] as const;

export class CreateBannerDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiProperty({ example: 'home' })
  @IsString()
  targetScreen!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ enum: BANNER_STATUSES, default: 'Draft' })
  @IsOptional()
  @IsIn(BANNER_STATUSES)
  status?: string;
}

export class UpdateBannerDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() cta?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() targetScreen?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsInt() @Min(0) priority?: number;
  @IsOptional() @IsIn(BANNER_STATUSES) status?: string;
}

// ── Dashboard Elements ──────────────────────────────────────────────────

const ELEMENT_TYPES = [
  'greeting',
  'banner',
  'card',
  'announcement',
  'tip',
  'spotlight',
] as const;

const ELEMENT_STATUSES = ['Draft', 'Active', 'Inactive'] as const;

export class CreateDashboardElementDto {
  @ApiProperty({ enum: ELEMENT_TYPES })
  @IsIn(ELEMENT_TYPES)
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({ default: 'home' })
  @IsOptional()
  @IsString()
  targetScreen?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: 'Flexible config (colors, icon, style)', example: { backgroundColor: '#3890F5', icon: 'star' } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ELEMENT_STATUSES, default: 'Draft' })
  @IsOptional()
  @IsIn(ELEMENT_STATUSES)
  status?: string;
}

export class UpdateDashboardElementDto {
  @IsOptional() @IsIn(ELEMENT_TYPES) type?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() cta?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() targetScreen?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsIn(ELEMENT_STATUSES) status?: string;
}
