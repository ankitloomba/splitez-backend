import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const INCOME_TYPES = [
  'Salary',
  'Cash',
  'Pocket Money',
  'Bonus',
  'Freelance',
  'Refund',
  'Other',
] as const;

export class CreateIncomeDto {
  @ApiProperty({ example: 5000000, description: 'Amount in minor units' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ enum: INCOME_TYPES })
  @IsIn(INCOME_TYPES)
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreatePersonalExpenseDto {
  @ApiProperty({ example: 15000, description: 'Amount in minor units' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'Coffee' })
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
