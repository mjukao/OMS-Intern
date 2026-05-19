import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './schema/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // ── CREATE ─────────────────────────────────────────────
  async create(dto: CreateOrderDto, customerId: string): Promise<Order> {
    const productIds = dto.items.map((i) => new Types.ObjectId(i.productId));

    const products = await this.productModel.find({
      _id: { $in: productIds },
      isActive: true,
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('ค้นหาสินค้าไม่พบหรือถูกปิดการขาย');
    }

    const orderItems = dto.items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId,
      );

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `สินค้า "${product.name}" มีสต็อกไม่พอ (มี ${product.stock} ชิ้น)`,
        );
      }

      return {
        product: product._id,       
        productName: product.name,  
        unitPrice: product.price,    
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      };
    });

    const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

    await Promise.all(
      dto.items.map((item) =>
        this.productModel.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        }),
      ),
    );

    const order = await this.orderModel.create({
      shop: new Types.ObjectId(dto.shopId),
      user: new Types.ObjectId(customerId),
      receiver: dto.receiver,
      shippingAddress: dto.shippingAddress,
      items: orderItems,
      status: 'pending',
      totalAmount,
      paymentMethod: dto.paymentMethod || 'cod',
      note: dto.note,
    });

    return order;
  }

  // READ ALL 
  async findAll(filters: {
    shopId?: string;
    customerId?: string;
    status?: string;
  }): Promise<Order[]> {
    const query: any = {};

    if (filters.shopId) query.shop = new Types.ObjectId(filters.shopId);
    if (filters.customerId) query.user = new Types.ObjectId(filters.customerId);
    if (filters.status) query.status = filters.status;

    return this.orderModel
      .find(query)
      .populate('shop', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }

  // READ ONE
  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('shop', 'name address')
      .populate('user', 'name email');

    if (!order) throw new NotFoundException('ไม่พบ order');
    return order;
  }

  // UPDATE STATUS 
  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('ไม่พบ order');

    if (order.status === 'cancelled') {
      throw new BadRequestException('ไม่สามารถแก้ไข order ที่ถูกยกเลิกแล้ว');
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('shop', 'name')
      .populate('user', 'name email');

    return updated;
  }

  //CANCEL (คืน stock)
  async cancel(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('ไม่พบ order');

    if (['delivered', 'cancelled'].includes(order.status)) {
      throw new BadRequestException(
        `ไม่สามารถยกเลิก order ที่ ${order.status} แล้ว`,
      );
    }

    await Promise.all(
      order.items.map((item) =>
        this.productModel.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        }),
      ),
    );

    return this.orderModel.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true },
    );
  }
}