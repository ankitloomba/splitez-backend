import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSettlementDto {
  @ApiProperty({ description: 'User ID of the person being paid' })
  @IsUUID('4')
  toId!: string;

  @ApiProperty({ example: 50000, description: 'Amount in minor units' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Idempotency key (§29)' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
