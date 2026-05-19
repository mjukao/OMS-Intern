import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ReceiverDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @IsString()
  @IsNotEmpty()
  subDistrict: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

export class CreateOrderDto {
  @IsMongoId()
  shopId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ValidateNested()
  @Type(() => ReceiverDto)
  receiver: ReceiverDto;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsIn(['transfer', 'cod'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
