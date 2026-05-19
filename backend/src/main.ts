import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.setGlobalPrefix('api');

  /*
   * Swagger Setup
   * DocumentBuilder → กำหนดข้อมูล API document
   * SwaggerModule.createDocument → สร้าง document
   * SwaggerModule.setup → เปิดหน้า UI ที่ path นี้
   */
  const config = new DocumentBuilder()
    .setTitle('OMS API')
    .setDescription('Order Management System API')
    .setVersion('1.0')
    .addBearerAuth()  // ← เพิ่มช่องใส่ JWT token ใน UI
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap();
//หน้าบ้านlocalhost5173
//หลังบ้านlocalhost3000
//http://localhost:3000/api/auth/google->ส่งให้หน้าบ้านรับค่าแล้วส่งต่อไปยังgoogle
//http://localhost:3000/api/auth/google/callback->ส่งกลับมาจากgoogleมายังหลังบ้านแล้วส่งกลับมาให้หน้าบ้าน