import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Push notification device token' })
  @IsString()
  token!: string;

  @ApiProperty({ enum: ['ios', 'android'] })
  @IsIn(['ios', 'android'])
  platform!: string;
}

export class RemoveDeviceDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
