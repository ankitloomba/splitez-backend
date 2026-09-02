import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateMeDto, UpdatePreferencesDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser('id') userId: string) {
    return this.users.me(userId);
  }

  @Put()
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(userId, dto);
  }

  @Post('profile-picture')
  @ApiBody({ schema: { properties: { url: { type: 'string' } } } })
  setProfilePicture(
    @CurrentUser('id') userId: string,
    @Body('url') url: string,
  ) {
    return this.users.setProfilePicture(userId, url);
  }

  @Get('preferences')
  getPreferences(@CurrentUser('id') userId: string) {
    return this.users.getPreferences(userId);
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.users.updatePreferences(userId, dto);
  }
}
