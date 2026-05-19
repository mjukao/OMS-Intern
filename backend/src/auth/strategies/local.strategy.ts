import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // บอกว่า field username ของเราคือ email
    super({ usernameField: 'email' });
  }

  // Passport เรียก validate() พร้อม email, password จาก body
  // ถ้า return  req.user มีค่า
  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Email หรือ Password ไม่ถูกต้อง');//if (!user) throw new UnauthorizedException ถ้าไม่เจอยูสให้หยุดทำไรแล้วแจ้งเออเรอร์
    return user; //ถ้าเจอให้ส่งค่ากลับไป
  }
}