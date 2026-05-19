import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UsersModule,  // ใช้โมดูล UsersModule
    PassportModule,  // ใช้โมดูล Passport สำหรับการจัดการกับการรับรองตัวตน
    JwtModule.registerAsync({
      inject: [ConfigService],  //  เพื่อดึงค่า Config
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),  // ดึง secret key สำหรับ JWT จาก config
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') as any },  // กำหนดเวลา expiration สำหรับ JWT
      }),
    }),
  ],
  controllers: [AuthController],  //เพื่อจัดการกับ request ที่เข้ามา
  providers: [
    AuthService,  //ซึ่งจะเป็นตัวจัดการการล็อกอิน การสร้าง JWT
    LocalStrategy,  //สำหรับการตรวจสอบการล็อกอินแบบพื้นฐาน (Username/Password)
    JwtStrategy,  //สำหรับการตรวจสอบการล็อกอินที่มีการใช้ JWT
    GoogleStrategy,  //สำหรับการล็อกอินผ่าน Google OAuth
  ],
})
export class AuthModule {}