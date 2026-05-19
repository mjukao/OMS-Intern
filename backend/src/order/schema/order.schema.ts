import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

// ── รายการสินค้า (embed) ──
@Schema({ _id: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string; // snapshot ชื่อสินค้า ณ ตอนสั่ง

  @Prop({ required: true, min: 0 })
  unitPrice: number; // snapshot ราคา ณ ตอนสั่ง

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// ── ข้อมูลผู้รับ (embed) ──
@Schema({ _id: false })
export class Receiver {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;
}

export const ReceiverSchema = SchemaFactory.createForClass(Receiver);

// ── ที่อยู่จัดส่ง (embed) ──
@Schema({ _id: false })
export class ShippingAddress {
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

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Shop', required: true })
  shop: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: ReceiverSchema, required: true })
  receiver: Receiver;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: OrderStatus;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: String, enum: ['transfer', 'cod'], default: 'cod' })
  paymentMethod: string;

  @Prop()
  note?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);