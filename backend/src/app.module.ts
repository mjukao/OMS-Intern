import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { ShopModule } from './shop/shop.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrderModule } from './order/order.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    ProductsModule,
    ShopModule,
    AuthModule,
    UsersModule,
    OrderModule
  ],
})
export class AppModule { }