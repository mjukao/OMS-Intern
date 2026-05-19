import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('ไม่พบ Email นี้');
    if (!user.password) throw new UnauthorizedException('บัญชีนี้ใช้ Google Login เท่านั้น');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Password ไม่ถูกต้อง');
    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    // access token หมดอายุใน 1 ชั่วโมง
    const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });

    // refresh token หมดอายุใน 7 วัน (ทำ field พิเศษเพื่อแยกจาก access token)
    const refresh_token = this.jwtService.sign(
      { ...payload, tokenType: 'refresh' },
      { expiresIn: '7d' },
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  // ใช้ refresh token เพื่อขอ access token ใหม่
  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('ไม่ใช่ refresh token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('ไม่พบผู้ใช้');

      const newPayload = { sub: payload.sub, email: payload.email, role: payload.role };
      return {
        access_token: this.jwtService.sign(newPayload, { expiresIn: '1h' }),
      };
    } catch {
      throw new UnauthorizedException('Refresh token หมดอายุหรือไม่ถูกต้อง กรุณา Login ใหม่');
    }
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
    return this.login(user);
  }

  async validateGoogleUser(googleUser: {
    googleId: string;
    name: string;
    email: string;
    avatar: string;
  }) {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    if (!user) {
      // ลอง หาด้วย email ก่อน (กรณีเคย register ด้วย email นั้นมาแล้ว)
      user = await this.usersService.findByEmail(googleUser.email);
      if (user) {
        // อัพเดต googleId ให้ผูกเข้ากับ account เดิม
        user = await this.usersService.updateGoogleId(user._id.toString(), googleUser.googleId, googleUser.avatar);
      } else {
        // สร้าง account ใหม่
        user = await this.usersService.create({
          googleId: googleUser.googleId,
          name: googleUser.name,
          email: googleUser.email,
          avatar: googleUser.avatar,
        });
      }
    }
    return user;
  }
}
