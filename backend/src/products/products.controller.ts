// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.productsService.findAll(search);
  }

  @Get('shop/:shopId')
  findByShop(@Param('shopId') shopId: string) {//@Param ใช้เพื่อดึง URL และส่งค่าไปให้ตัวแปร shopId
    return this.productsService.findByShop(shopId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {//@Param ใช้เพื่อดึง URL และส่งค่าไปให้ตัวแปร id
    return this.productsService.findOne(id);
  }
   
  @Patch(':id')//@patch ใช้สำหรับรับคำขอ PATCH ที่มาที่ 
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}