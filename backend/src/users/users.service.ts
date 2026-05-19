import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    if (data.email) {
      const existing = await this.userModel.findOne({ email: data.email });
      if (existing) throw new ConflictException('Email นี้ถูกใช้แล้ว');
    }
    const user = new this.userModel(data);
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  // ผูก googleId กับ account เดิม (สมัครด้วย email มาก่อน)
  async updateGoogleId(userId: string, googleId: string, avatar?: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { googleId, ...(avatar && { avatar }) },
      { new: true },
    ).exec();
  }
  // ── Profile ───────────────────────────────────────────
  async getProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -googleId');
    if (!user) throw new NotFoundException('ไม่พบ user');
    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, dto, { new: true })
      .select('-password -googleId');
    if (!user) throw new NotFoundException('ไม่พบ user');
    return user;
  }

  // ── Addresses ─────────────────────────────────────────
  async addAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('ไม่พบ user');

    // ถ้าตั้ง isDefault ให้ unset ที่อยู่อื่นก่อน
    if (dto.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    // ถ้ายังไม่มีที่อยู่เลย set เป็น default อัตโนมัติ
    if (user.addresses.length === 0) {
      dto.isDefault = true;
    }

    user.addresses.push(dto as any);
    await user.save();
    return user.toObject();
  }

  async updateAddress(
    userId: string,
    addrId: string,
    dto: UpdateAddressDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('ไม่พบ user');

    const addr = user.addresses.find((a) => a._id.toString() === addrId);
    if (!addr) throw new NotFoundException('ไม่พบที่อยู่');

    if (dto.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    Object.assign(addr, dto);
    await user.save();
    return user.toObject();
  }

  async deleteAddress(userId: string, addrId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('ไม่พบ user');

    const idx = user.addresses.findIndex((a) => a._id.toString() === addrId);
    if (idx === -1) throw new NotFoundException('ไม่พบที่อยู่');

    const wasDefault = user.addresses[idx].isDefault;
    user.addresses.splice(idx, 1);

    // ถ้าลบ default ให้ set อันแรกเป็น default แทน
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.toObject();
  }

  async setDefaultAddress(
    userId: string,
    addrId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('ไม่พบ user');

    const addr = user.addresses.find((a) => a._id.toString() === addrId);
    if (!addr) throw new NotFoundException('ไม่พบที่อยู่');

    user.addresses.forEach((a) => (a.isDefault = false));
    addr.isDefault = true;

    await user.save();
    return user.toObject();
  }
}