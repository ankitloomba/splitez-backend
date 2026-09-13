import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateMeDto, UpdatePreferencesDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.users.me(userId);
  }

  @Put('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(userId, dto);
  }

  @Post('me/profile-picture')
  @ApiBody({ schema: { properties: { url: { type: 'string' } } } })
  setProfilePicture(
    @CurrentUser('id') userId: string,
    @Body('url') url: string,
  ) {
    return this.users.setProfilePicture(userId, url);
  }

  @Get('me/preferences')
  getPreferences(@CurrentUser('id') userId: string) {
    return this.users.getPreferences(userId);
  }

  @Put('me/preferences')
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.users.updatePreferences(userId, dto);
  }
}
