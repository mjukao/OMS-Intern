import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

export class ShopAddressDto {
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

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @ValidateNested()
  @Type(() => ShopAddressDto)
  address: ShopAddressDto;

  @IsOptional()
  @IsString()
  description?: string;
}