import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  MaxLength,
} from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'URL of uploaded profile picture' })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    example: ['home', 'groups', 'trips', 'finances', 'more'],
    description: 'Ordered main-navigation tabs. "home" and "more" are mandatory.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  navigationOrder?: string[];

  @ApiPropertyOptional({ description: 'Notification category toggles' })
  @IsOptional()
  @IsObject()
  notificationSettings?: Record<string, unknown>;
}
