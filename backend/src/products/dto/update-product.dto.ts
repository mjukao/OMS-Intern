// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
// PartialType ทำให้ทุก field เป็น optional
// ไม่ต้องเขียน DTO ใหม่ทั้งหมด
// PATCH ส่งมาแค่บางส่วนได้
export class UpdateProductDto extends PartialType(CreateProductDto) {}