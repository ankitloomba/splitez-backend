import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'E.164 phone number' })
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164 format' })
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164 format' })
  phone!: string;

  @ApiProperty({ example: '000000', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiPropertyOptional({ example: 'Ankit', description: 'Required on first-ever verification (signup)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Loomba' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
