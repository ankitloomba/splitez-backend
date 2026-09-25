import { IsString, IsEmail, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnquiryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: ['Feedback', 'Complaints', 'Suggestions', 'General'] })
  @IsIn(['Feedback', 'Complaints', 'Suggestions', 'General'])
  topic: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
