import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SplitMethod } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ---------------------------------------------------------------------------
// Split participant – used inside Create / Update DTOs
// ---------------------------------------------------------------------------

export class SplitParticipantDto {
  @ApiProperty({ description: 'User ID of the participant' })
  @IsUUID('4')
  userId!: string;

  @ApiPropertyOptional({
    description: 'Share amount in minor units (required for EXACT split)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  shareAmount?: number;

  @ApiPropertyOptional({
    description: 'Percentage in basis points, 10000 = 100% (required for PERCENTAGE split)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  percentageBps?: number;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export class CreateExpenseDto {
  @ApiProperty({ example: 'Dinner at Taj' })
  @IsString()
  @MaxLength(200)
  description!: string;

  @ApiProperty({ example: 150000, description: 'Amount in minor units (e.g. 1500.00 INR = 150000 paise)' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: SplitMethod, example: 'EQUAL' })
  @IsEnum(SplitMethod)
  splitMethod!: SplitMethod;

  @ApiPropertyOptional({ example: 'Food & Dining' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Receipt image URL' })
  @IsOptional()
  @IsString()
  receipt?: string;

  @ApiPropertyOptional({ example: '2027-01-12' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Who paid (defaults to current user)' })
  @IsOptional()
  @IsUUID('4')
  paidById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  tripId?: string;

  @ApiPropertyOptional({ description: 'Idempotency key for duplicate protection (§29)' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiProperty({ type: [SplitParticipantDto], description: 'Participants and their split details' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SplitParticipantDto)
  splits!: SplitParticipantDto[];
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export class UpdateExpenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: SplitMethod })
  @IsOptional()
  @IsEnum(SplitMethod)
  splitMethod?: SplitMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receipt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  paidById?: string;

  @ApiPropertyOptional({ type: [SplitParticipantDto] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SplitParticipantDto)
  splits?: SplitParticipantDto[];
}
