/**
 * Migration: แปลง data เก่า → โครงสร้างใหม่
 *
 * Orders:
 *   - shippingAddress (string) → receiver (object) + shippingAddress (object 5 fields)
 *   - note (ชำระเงิน) → paymentMethod (field แยก)
 *
 * Shops:
 *   - address (string) → address (object 5 fields)
 *   - เพิ่ม phone, isActive
 *
 * วิธีรัน:
 *   npx ts-node src/migrate-orders.ts
 */
import mongoose from 'mongoose';

import * as dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/oms';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ เชื่อมต่อ MongoDB แล้ว');

  const db = mongoose.connection.db;

  // ════════════════════════════════════════
  // ORDERS Migration
  // ════════════════════════════════════════
  const orders = db.collection('orders');

  // 1) shippingAddress string → receiver + shippingAddress object
  const oldOrders = await orders
    .find({ shippingAddress: { $type: 'string' } })
    .toArray();

  console.log(`📦 Orders: พบ ${oldOrders.length} รายการ (shippingAddress string)`);

  let orderUpdated1 = 0;
  for (const order of oldOrders) {
    const addr: string = order.shippingAddress || '';
    const parts = addr.split(' | ');
    const name = parts[0] ? parts[0].replace('ผู้รับ: ', '') : 'ไม่ระบุ';
    const phone = parts[1] ? parts[1].replace('โทร: ', '') : '';
    const addressText = parts[2] ? parts[2].replace('ที่อยู่: ', '') : '';

    let paymentMethod = 'cod';
    if (order.note && order.note.includes('โอนเงิน')) paymentMethod = 'transfer';

    let newNote = order.note || '';
    newNote = newNote.replace(/ชำระเงิน: (โอนเงิน|เก็บเงินปลายทาง)/, '').trim();

    await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          receiver: { name, phone },
          shippingAddress: {
            addressLine: addressText,
            subDistrict: '',
            district: '',
            province: '',
            postalCode: '',
          },
          paymentMethod,
          note: newNote || null,
        },
      },
    );
    orderUpdated1++;
  }

  // 2) receiver.address (เก่า) → shippingAddress object
  const oldReceiverOrders = await orders
    .find({ 'receiver.address': { $exists: true } })
    .toArray();

  console.log(`📦 Orders: พบ ${oldReceiverOrders.length} รายการ (receiver.address)`);

  let orderUpdated2 = 0;
  for (const order of oldReceiverOrders) {
    const addressText = order.receiver?.address || '';

    await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          'receiver.name': order.receiver?.name || 'ไม่ระบุ',
          'receiver.phone': order.receiver?.phone || '',
          shippingAddress: {
            addressLine: addressText,
            subDistrict: '',
            district: '',
            province: '',
            postalCode: '',
          },
        },
        $unset: { 'receiver.address': '' },
      },
    );
    orderUpdated2++;
  }

  // ════════════════════════════════════════
  // SHOPS Migration
  // ════════════════════════════════════════
  const shops = db.collection('shops');

  const oldShops = await shops
    .find({ address: { $type: 'string' } })
    .toArray();

  console.log(`🏪 Shops: พบ ${oldShops.length} รายการ (address string)`);

  let shopUpdated = 0;
  for (const shop of oldShops) {
    const addressText: string = shop.address || '';

    await shops.updateOne(
      { _id: shop._id },
      {
        $set: {
          phone: shop.phone || '',
          address: {
            addressLine: addressText,
            subDistrict: '',
            district: '',
            province: '',
            postalCode: '',
          },
          isActive: shop.isActive ?? true,
        },
      },
    );
    shopUpdated++;
  }

  console.log('');
  console.log('══════════════════════════════');
  console.log(`✅ Orders: ${orderUpdated1} (string→object) + ${orderUpdated2} (receiver.address)`);
  console.log(`✅ Shops:  ${shopUpdated} (address string→object)`);
  console.log('══════════════════════════════');

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ ไมเกรทล้มเหลว:', err);
  process.exit(1);
});
