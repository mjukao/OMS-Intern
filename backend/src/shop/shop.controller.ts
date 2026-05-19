import { Controller, Get, Post, Body, Param, Patch, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  create(@Body() dto: CreateShopDto, @Req() req: any) {
    return this.shopService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any, @Query('search') search?: string) {
    return this.shopService.findAll(req.user.userId, search);
  }

  @Get(':id/customers')
  getCustomers(@Param('id') id: string) {
    return this.shopService.getCustomers(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShopDto, @Req() req: any) {
    return this.shopService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.shopService.delete(id, req.user.userId);
  }
}
