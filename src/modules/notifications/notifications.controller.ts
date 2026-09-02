import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  RegisterDeviceDto,
  RemoveDeviceDto,
} from './dto/notifications.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notifications.list(userId, cursor, limit ? +limit : 20);
  }

  @Patch(':id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Post('devices')
  registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notifications.registerDevice(userId, dto.token, dto.platform);
  }

  @Delete('devices')
  removeDevice(@Body() dto: RemoveDeviceDto) {
    return this.notifications.removeDevice(dto.token);
  }
}
