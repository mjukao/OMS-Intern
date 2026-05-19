import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Order, OrderSchema } from './schema/order.schema';
import { OrderController } from './order.controller';
import { OrdersService } from './order.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema }, // ใช้ check/deduct stock
    ]),
  ],
  controllers: [OrderController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrderModule {}
