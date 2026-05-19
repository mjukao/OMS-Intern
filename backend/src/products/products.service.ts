// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // สร้างสินค้า — ถ้ามี shopId ให้ผูกเข้า shop ด้วย
  async create(dto: CreateProductDto) {
    const { shopId, ...rest } = dto;
    const product = new this.productModel({
      ...rest,
      // ถ้ามี shopId แปลงเป็น ObjectId แล้วเก็บ
      // ถ้าไม่มี  ไม่เก็บ field shop
      ...(shopId && { shop: new Types.ObjectId(shopId) }),
    });
    return product.save();
  }

  // ดูสินค้าทั้งหมด  populate shop ให้เห็นชื่อร้าน
  async findAll(search?: string) {
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {}; //ถ้ามี search มาให้ค้นหา
    return this.productModel
      .find(filter)// filter ใช้สำหรับกรองข้อมูล
      .populate('shop', 'name')//ดึงชื่อร้านค้ามาไม่ดึงแค่ id
      .exec();
  }

  // ดูสินค้าทั้งหมดใน shop นั้น
  async findByShop(shopId: string) {
    return this.productModel
      .find({ shop: new Types.ObjectId(shopId) })//คำสั่งนี้ใช้เพื่อแปลง shopId (ที่เป็น string)
      .populate('shop', 'name')
      .exec();
  }

  async findOne(id: string) {
    const product = await this.productModel//await ใช้เพื่อรอให้คำขอจาก Mongoose Model เสร็จสิ้นก่อนที่จะเก็บผลลัพธ์ลงในตัวแปร product.
      .findById(id)
      .populate('shop', 'name')//.populate('shop', 'name') ใช้เพื่อแสดงชื่อของร้าน (ไม่แค่ ObjectId).
      .exec();
    if (!product) throw new NotFoundException('ไม่พบสินค้า');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
  const { shopId, ...rest } = dto;
  
  const product = await this.productModel
    .findByIdAndUpdate(
      id,  // ใช้ id ที่ส่งมาจากคำขอ
      {
        ...rest,  // ข้อมูลอื่น ๆ ที่ต้องการอัปเดต
        ...(shopId && { shop: new Types.ObjectId(shopId) }), // ถ้ามี shopId, จะใส่ ObjectId ของ shop
      },
      { new: true }  // คืนค่าผลลัพธ์เป็นข้อมูลที่อัปเดตแล้ว
    )
    .populate('shop', 'name')  // ใช้ populate เพื่อแสดงชื่อของร้าน (ไม่แค่ ObjectId)
    .exec();

  if (!product) throw new NotFoundException('ไม่พบสินค้า');
  
  return product;  // ส่งกลับสินค้าใหม่ที่ถูกอัปเดต
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) throw new NotFoundException('ไม่พบสินค้า');
    return { message: 'ลบสำเร็จ' }; // คืนค่าข้อความเมื่อลบสินค้าสำเร็จ
  }
}