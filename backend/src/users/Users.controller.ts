import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/me
  @Get('me')
  getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  // PATCH /api/users/me
  @Patch('me')
  updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  // POST /api/users/me/addresses
  @Post('me/addresses')
  addAddress(@Req() req, @Body() dto: CreateAddressDto) {
    return this.usersService.addAddress(req.user.userId, dto);
  }

  // PATCH /api/users/me/addresses/:addrId
  @Patch('me/addresses/:addrId')
  updateAddress(
    @Req() req,
    @Param('addrId') addrId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(req.user.userId, addrId, dto);
  }

  // DELETE /api/users/me/addresses/:addrId
  @Delete('me/addresses/:addrId')
  deleteAddress(@Req() req, @Param('addrId') addrId: string) {
    return this.usersService.deleteAddress(req.user.userId, addrId);
  }

  // PATCH /api/users/me/addresses/:addrId/default
  @Patch('me/addresses/:addrId/default')
  setDefault(@Req() req, @Param('addrId') addrId: string) {
    return this.usersService.setDefaultAddress(req.user.userId, addrId);
  }
}
