import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // อ่าน token จาก Header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),//ใช้ JWT_SECRET จาก .env มาตรวจว่า token นี้ถูกสร้างจากระบบเราจริงไหม
    });
  }

  // validate() ถูกเรียกหลัง verify token สำเร็จ
  // return value → เก็บใน req.user อัตโนมัติ
  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}