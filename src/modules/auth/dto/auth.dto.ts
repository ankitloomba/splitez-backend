import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// ---------------------------------------------------------------------------
// Password-based auth (DEFAULT)
// ---------------------------------------------------------------------------

export class RegisterDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Ankit' })
  @IsString()
  @MaxLength(50)
  firstName!: string;

  @ApiPropertyOptional({ example: 'Loomba' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Optional E.164 phone' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164 format' })
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongP@ss1' })
  @IsString()
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email verification token from the link' })
  @IsString()
  token!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ankit@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password-reset token from the link' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewStr0ngP@ss', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

// ---------------------------------------------------------------------------
// OTP-based auth (OPTIONAL / secondary)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}
