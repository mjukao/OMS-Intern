// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    // ลงทะเบียน Product Schema ใน module นี้
    // name: Product.name ชื่อ collection คือ 'products'
    MongooseModule.forFeature([//เป็นการ ลงทะเบียน Mongoose Schema ในโมดูลของ NestJS
      { name: Product.name, schema: ProductSchema },//Product.name: ตัวแปรที่เก็บชื่อของ Model (Product)
    ]),// schema: ProductSchema: ตัวแปรที่เก็บ Schema (ProductSchema)
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}