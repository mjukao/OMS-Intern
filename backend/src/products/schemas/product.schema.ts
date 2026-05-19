// src/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ default: true })
  isActive: boolean;

  // ผูก product เข้ากับ shop 
  @Prop({ type: Types.ObjectId, ref: 'Shop', required: false })
  shop?: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);