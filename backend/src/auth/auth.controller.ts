import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalGuard } from './guards/local.guard';
import { JwtGuard } from './guards/jwt.guard';
import { GoogleGuard } from './guards/google.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalGuard)
  @Post('login')
  login(@Req() req: any) {
    return this.authService.login(req.user);
  }

  // ขอ access token ใหม่โดยใช้ refresh token
  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(GoogleGuard)
  @Get('google')
  googleLogin() {}

  @UseGuards(GoogleGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.login(req.user);
    const frontendUrl = this.config.get('FRONTEND_URL');
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.access_token}&refresh=${result.refresh_token}`,
    );
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return req.user;
  }
}
