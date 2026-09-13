import { Body, Controller, Post, Get, Query, HttpCode, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Get('verify-email')
  async verifyEmailGet(@Query('token') token: string, @Res() res: Response) {
    try {
      await this.auth.verifyEmail({ token });
      res.type('html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verified — SplitEZ</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #10142A; color: #fff; }
            .card { text-align: center; padding: 48px 32px; max-width: 400px; }
            .check { font-size: 64px; margin-bottom: 16px; }
            h1 { font-size: 24px; margin: 0 0 12px; color: #818CF8; }
            p { color: #9CA3AF; font-size: 16px; line-height: 1.5; }
            .btn { display: inline-block; margin-top: 24px; background: #4338CA; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="check">✅</div>
            <h1>Email Verified!</h1>
            <p>Your SplitEZ account is ready. You can now log in from the app.</p>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      const message = err?.response?.message ?? err.message ?? 'Verification failed';
      res.status(400).type('html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verification Failed — SplitEZ</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #10142A; color: #fff; }
            .card { text-align: center; padding: 48px 32px; max-width: 400px; }
            .icon { font-size: 64px; margin-bottom: 16px; }
            h1 { font-size: 24px; margin: 0 0 12px; color: #F87171; }
            p { color: #9CA3AF; font-size: 16px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">❌</div>
            <h1>Verification Failed</h1>
            <p>${message}</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  @Post('resend-verification')
  @HttpCode(200)
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  logout() {
    return this.auth.logout();
  }
}
