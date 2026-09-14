import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-auth.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Admin – Auth')
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login (env credentials) → admin token' })
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Verify current admin session' })
  me(@Req() req: any) {
    return { authenticated: true, admin: req.admin };
  }
}
