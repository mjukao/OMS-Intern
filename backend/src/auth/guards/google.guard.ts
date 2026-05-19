import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleGuard extends AuthGuard('google') {
  // บังคับให้ Google แสดงหน้าเลือกบัญชีทุกครั้ง ไม่ login อัตโนมัติ
  getAuthenticateOptions() {
    return { prompt: 'select_account' };
  }
}
