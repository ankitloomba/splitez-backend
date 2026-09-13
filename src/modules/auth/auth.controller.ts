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

  @Get('reset-password')
  async resetPasswordGet(@Query('token') token: string, @Res() res: Response) {
    const styles = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #10142A; color: #fff; }
      .card { text-align: center; padding: 48px 32px; max-width: 400px; width: 100%; }
      .icon { font-size: 64px; margin-bottom: 16px; }
      h1 { font-size: 24px; margin: 0 0 12px; color: #818CF8; }
      p { color: #9CA3AF; font-size: 16px; line-height: 1.5; }
      input { width: 100%; box-sizing: border-box; padding: 12px 16px; border: 1px solid #3730A3; border-radius: 8px; background: #1E1B4B; color: #fff; font-size: 16px; margin: 8px 0; outline: none; }
      input:focus { border-color: #818CF8; }
      .btn { display: block; width: 100%; background: #4338CA; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; margin-top: 16px; }
      .btn:hover { background: #3730A3; }
      .error { color: #F87171; font-size: 14px; margin-top: 8px; }
      .success { color: #34D399; }
      label { display: block; text-align: left; color: #9CA3AF; font-size: 13px; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    `;
    res.type('html').send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reset Password — SplitEZ</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="card" id="card">
          <div class="icon">🔑</div>
          <h1>Reset Your Password</h1>
          <p>Enter your new password below.</p>
          <form id="form">
            <label for="password">New Password</label>
            <input type="password" id="password" placeholder="Min 8 characters" required minlength="8" />
            <label for="confirm">Confirm Password</label>
            <input type="password" id="confirm" placeholder="Re-enter password" required minlength="8" />
            <div class="error" id="error" style="display:none"></div>
            <button type="submit" class="btn">Reset Password</button>
          </form>
        </div>
        <script>
          document.getElementById('form').addEventListener('submit', async function(e) {
            e.preventDefault();
            var pw = document.getElementById('password').value;
            var confirm = document.getElementById('confirm').value;
            var errEl = document.getElementById('error');
            errEl.style.display = 'none';
            if (pw !== confirm) { errEl.textContent = 'Passwords do not match'; errEl.style.display = 'block'; return; }
            if (pw.length < 8) { errEl.textContent = 'Password must be at least 8 characters'; errEl.style.display = 'block'; return; }
            try {
              var resp = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: '${token}', password: pw })
              });
              var data = await resp.json();
              if (!resp.ok) throw new Error(data.message || 'Reset failed');
              document.getElementById('card').innerHTML = '<div class="icon">✅</div><h1 class="success">Password Reset!</h1><p>Your password has been updated. You can now log in from the app.</p>';
            } catch (err) {
              errEl.textContent = err.message;
              errEl.style.display = 'block';
            }
          });
        </script>
      </body>
      </html>
    `);
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
