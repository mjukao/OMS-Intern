import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShopDocument = Shop & Document;

// ── ที่อยู่ร้านค้า (embed) ──
@Schema({ _id: false })
export class ShopAddress {
  @Prop({ required: true })
  addressLine: string; // บ้านเลขที่ / หมู่บ้าน / ถนน

  @Prop({ required: true })
  subDistrict: string; // ตำบล

  @Prop({ required: true })
  district: string; // อำเภอ

  @Prop({ required: true })
  province: string; // จังหวัด

  @Prop({ required: true })
  postalCode: string; // รหัสไปรษณีย์
}

export const ShopAddressSchema = SchemaFactory.createForClass(ShopAddress);

@Schema({ timestamps: true })
export class Shop {
  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop({ type: ShopAddressSchema, required: true })
  address: ShopAddress;

  @Prop()
  description: string;

  // เจ้าของร้าน — ผูกกับ User ที่ล็อกอิน
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);
