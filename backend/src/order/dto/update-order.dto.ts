import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  note?: string;
}