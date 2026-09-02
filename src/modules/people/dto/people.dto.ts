import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class AddPersonDto {
  @ApiProperty({ example: '+919812345678', description: 'E.164 phone number' })
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164 format' })
  phone!: string;
}

export class InvitePersonDto {
  @ApiProperty({ example: '+919812345678' })
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164 format' })
  phone!: string;

  @ApiPropertyOptional({ example: 'Rahul' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}

export class SearchPeopleDto {
  @ApiPropertyOptional({ description: 'Name or phone fragment' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;
}
