import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalGuard extends AuthGuard('local') {} // สำหรับการตรวจสอบการล็อกอินแบบพื้นฐาน (Username/Password)