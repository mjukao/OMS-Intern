// src/shops/shop.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { Shop, ShopSchema } from './schema/shop.schema';
import { Order, OrderSchema } from 'src/order/schema/order.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Shop.name, schema: ShopSchema },{name:Order.name,schema:OrderSchema}])],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}