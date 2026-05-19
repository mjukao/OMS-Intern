# คู่มือระบบ OMS (Order Management System)

> อ่านตั้งแต่ต้น ไม่ต้องรู้อะไรมาก่อน ก็เข้าใจได้ทั้งระบบ

---

## ภาพรวม ระบบนี้ทำอะไร?

ระบบนี้คือ **ระบบจัดการคำสั่งซื้อ** สำหรับร้านค้า
- สร้างร้านค้าได้ หลายร้าน
- เพิ่มสินค้าในแต่ละร้านได้
- สร้างคำสั่งซื้อ เลือกสินค้า กรอกที่อยู่ผู้รับ เลือกวิธีชำระเงิน
- ดูบิล แก้สถานะ หรือยกเลิกคำสั่งซื้อได้
- มีระบบ Login / Register และ Login ด้วย Google

---

## โครงสร้างโปรเจกต์

```
p1/
├── frontend/          ← หน้าเว็บ (Vue 3)
│   └── src/
│       ├── main.ts          ← จุดเริ่มต้น เปิดแอป
│       ├── App.vue          ← หน้าหลัก มี Navbar
│       ├── router/          ← กำหนดเส้นทาง URL
│       ├── stores/          ← เก็บข้อมูลกลาง (Pinia)
│       ├── views/           ← หน้าต่างๆ
│       ├── types/           ← กำหนดรูปแบบข้อมูล
│       └── services/        ← ตัวยิง API
│
└── backend/           ← หลังบ้าน (NestJS)
    └── src/
        ├── main.ts          ← เปิด Server พอร์ต 3000
        ├── app.module.ts    ← ลงทะเบียน Module ทั้งหมด
        ├── auth/            ← Module Login/Register
        ├── users/           ← Module จัดการผู้ใช้
        ├── shop/            ← Module ร้านค้า
        ├── products/        ← Module สินค้า
        └── order/           ← Module คำสั่งซื้อ
```

---

## หน้าเว็บมีอะไรบ้าง (Router)

ไฟล์: `frontend/src/router/index.ts`

| URL | หน้าที่แสดง | ต้อง Login? |
|-----|-------------|-------------|
| `/` | redirect ไป `/shops` | - |
| `/login` | หน้า Login | ❌ |
| `/auth/callback` | รับ token จาก Google | ❌ |
| `/shops` | รายการร้านค้าทั้งหมด | ✅ |
| `/shops/:id` | สินค้าของร้านนั้น | ✅ |
| `/shops/:id/orders` | คำสั่งซื้อของร้านนั้น | ✅ |
| `/shops/:id/orders/create` | สร้างคำสั่งซื้อ | ✅ |
| `/orders` | คำสั่งซื้อทั้งหมด | ✅ |
| `/profile` | โปรไฟล์ผู้ใช้ | ✅ |
| `/customers` | รายชื่อลูกค้า | ✅ |

**Router Guard** คือ: ทุกครั้งที่เปลี่ยนหน้า ระบบจะเช็คก่อนว่า Login หรือยัง
ถ้ายังไม่ Login และหน้านั้นต้อง Login → พาไปหน้า `/login` อัตโนมัติ

---

## Pinia Store คืออะไร?

Store คือ **ที่เก็บข้อมูลกลาง** ที่ทุกหน้าเรียกใช้ได้
แทนที่จะให้แต่ละหน้าดึงข้อมูลเอง ก็ให้ Store จัดการแทน

มี 5 Store:

### 1. `auth.store.ts` — จัดการการ Login

**เก็บ:** token (ใน localStorage), ข้อมูล user ปัจจุบัน

**ฟังก์ชัน:**
- `login(email, password)` → ยิง POST /api/auth/login → เก็บ token
- `register(name, email, password)` → ยิง POST /api/auth/register
- `fetchMe()` → ยิง GET /api/auth/me → ดึงข้อมูล user ปัจจุบัน
- `logout()` → ลบ token ออกจาก localStorage

### 2. `shop.store.ts` — จัดการร้านค้า

**เก็บ:** รายการร้านค้าทั้งหมด

**ฟังก์ชัน:**
- `fetchAll(search?)` → ยิง GET /api/shops
- `createShop(data)` → ยิง POST /api/shops
- `updateShop(id, data)` → ยิง PATCH /api/shops/:id
- `removeShop(id)` → ยิง DELETE /api/shops/:id

### 3. `product.store.ts` — จัดการสินค้า

**เก็บ:** รายการสินค้าทั้งหมด

**ฟังก์ชัน:**
- `fetchAll(search?)` → ยิง GET /api/products
- `createProduct(data)` → ยิง POST /api/products
- `updateProduct(id, data)` → ยิง PATCH /api/products/:id
- `removeProduct(id)` → ยิง DELETE /api/products/:id

### 4. `order.store.ts` — จัดการคำสั่งซื้อ

**เก็บ:** รายการออเดอร์, ออเดอร์ที่กำลังดูอยู่

**ฟังก์ชัน:**
- `fetchAll({ shopId?, status?, customerId? })` → ยิง GET /api/orders พร้อม filter
- `createOrder(data)` → ยิง POST /api/orders
- `updateOrder(id, data)` → ยิง PATCH /api/orders/:id
- `cancelOrder(id)` → ยิง PATCH /api/orders/:id/cancel

### 5. `user.store.ts` — จัดการโปรไฟล์

**เก็บ:** ข้อมูลโปรไฟล์, รายชื่อลูกค้า

**ฟังก์ชัน:**
- `fetchProfile()` → ยิง GET /api/users/me
- `updateProfile(data)` → ยิง PATCH /api/users/me
- `addAddress(data)` → ยิง POST /api/users/me/addresses
- `fetchCustomers(shopId)` → ยิง GET /api/shops/:shopId/customers

---

## API Service คืออะไร?

ไฟล์: `frontend/src/services/api.ts`

คือ Axios Instance ที่ตั้งค่าไว้ล่วงหน้า:
- `baseURL` = `http://localhost:3000/api`
- ทุก request จะแนบ `Authorization: Bearer <token>` ไปโดยอัตโนมัติ (อ่านจาก localStorage)

ดังนั้นแทนที่จะเขียน:
```js
axios.get('http://localhost:3000/api/orders', { headers: { Authorization: 'Bearer ...' } })
```

เขียนแค่:
```js
api.get('/orders')
```

---

## Backend ทำงานยังไง?

### จุดเริ่มต้น `backend/src/main.ts`

```
เปิด Server พอร์ต 3000
URL prefix ทุกอันต้องมี /api นำหน้า
เปิด CORS รับคำขอจาก http://localhost:5173 (หน้าเว็บ)
เปิด Validation Pipe (ตรวจ DTO อัตโนมัติ)
Swagger Docs อยู่ที่ http://localhost:3000/api/docs
```

### `app.module.ts` — ลงทะเบียน Module

```
เชื่อมต่อ MongoDB (อ่าน MONGO_URI จาก .env)
โหลด Module: Auth, Users, Shop, Products, Order
```

### แต่ละ Module มี 3 ชิ้น

| ชิ้น | หน้าที่ |
|------|---------|
| Controller | รับ HTTP Request แล้วส่งต่อให้ Service |
| Service | Logic ทั้งหมด (คิด คำนวณ บันทึก) |
| Schema | รูปแบบข้อมูลใน MongoDB |

---

## Module Auth — Login / Register

### Schema (ไม่มี Schema ตรงๆ ใช้ User Schema)

### Controller → Service Flow

**Register:**
```
POST /api/auth/register
  ↓ { name, email, password }
  ↓ auth.service.register()
    ↓ bcrypt.hash(password, 10)  ← เข้ารหัสรหัสผ่าน
    ↓ users.service.create()     ← บันทึก user ใน DB
    ↓ auth.service.login()       ← สร้าง JWT token
  ↓ return { access_token, user }
```

**Login:**
```
POST /api/auth/login
  ↓ { email, password }
  ↓ LocalGuard → auth.service.validateUser()
    ↓ หา user ด้วย email
    ↓ bcrypt.compare(password, user.password)  ← เทียบรหัสผ่าน
    ↓ ถ้าไม่ตรง → throw UnauthorizedException
  ↓ auth.service.login()
    ↓ สร้าง payload = { sub: userId, email, role }
    ↓ jwt.sign(payload) → access_token
  ↓ return { access_token, user: { id, name, email, role, avatar } }
```

**ดึงข้อมูล User ปัจจุบัน:**
```
GET /api/auth/me
  ↓ JwtGuard → ตรวจ token ใน Header
    ↓ ถ้า token ไม่ถูกต้อง → 401 Unauthorized
  ↓ return req.user (ข้อมูลจาก token)
```

**Login ด้วย Google:**
```
GET /api/auth/google
  ↓ redirect ไป Google OAuth
GET /api/auth/google/callback
  ↓ Google ส่ง profile กลับมา
  ↓ authService.validateGoogleUser()
    ↓ หา user ด้วย googleId หรือ email
    ↓ ถ้าไม่มี → สร้าง user ใหม่
  ↓ สร้าง token → redirect ไป frontend พร้อม token ใน URL
```

### User Schema (MongoDB)

```
users collection:
  name         string (ต้องมี)
  email        string (ไม่ซ้ำ, lowercase)
  password     string (อาจไม่มีถ้า Login ด้วย Google)
  googleId     string (ไม่ซ้ำ, มีแค่คนที่ Login ด้วย Google)
  avatar       string (URL รูปโปรไฟล์)
  role         string (default: 'user')
  firstName    string
  lastName     string
  phone        string
  addresses    Array ของ Address (ดูด้านล่าง)
  createdAt    Date
  updatedAt    Date

Address (ซ้อนอยู่ใน User):
  _id        ObjectId
  label      string  (เช่น "บ้าน", "ที่ทำงาน")
  fullName   string
  phone      string
  address    string  (ที่อยู่เต็ม)
  isDefault  boolean (default: false)
```

---

## Module Users — จัดการโปรไฟล์และที่อยู่

ทุก API ต้องแนบ token

```
GET    /api/users/me                          → ดูโปรไฟล์ตัวเอง
PATCH  /api/users/me                          → แก้ชื่อ/โทร
POST   /api/users/me/addresses                → เพิ่มที่อยู่
PATCH  /api/users/me/addresses/:addrId        → แก้ที่อยู่
DELETE /api/users/me/addresses/:addrId        → ลบที่อยู่
PATCH  /api/users/me/addresses/:addrId/default → ตั้งเป็นที่อยู่หลัก
```

**Logic ที่น่าสนใจ:**
- เพิ่มที่อยู่แรก → ตั้งเป็น default อัตโนมัติ
- ถ้าตั้ง default ใหม่ → ยกเลิก default เดิมก่อน
- ถ้าลบที่อยู่ที่เป็น default → ไม่มี default (ต้องตั้งใหม่เอง)

---

## Module Shop — จัดการร้านค้า

```
POST   /api/shops           → สร้างร้านค้า { name, address, description }
GET    /api/shops           → ดูร้านค้าทั้งหมด (?search=ชื่อ)
GET    /api/shops/:id       → ดูร้านค้าชิ้นเดียว
PATCH  /api/shops/:id       → แก้ไขร้านค้า
DELETE /api/shops/:id       → ลบร้านค้า
GET    /api/shops/:id/customers → ดูรายชื่อลูกค้าของร้านนั้น
```

**Shop Schema (MongoDB):**
```
shops collection:
  name         string (ต้องมี)
  address      string (ต้องมี)
  description  string
```

**getCustomers ทำงานยังไง?**

ใช้ MongoDB Aggregate (รวมข้อมูลจากหลาย collection):
```
1. หา Order ทั้งหมดที่มี shop = shopId นั้น
2. Group by user → นับจำนวน order และรวม totalAmount
3. Populate ข้อมูล user (name, email, phone)
4. return รายชื่อลูกค้าพร้อม orderCount, totalSpent, orders[]
```

---

## Module Products — จัดการสินค้า

```
POST   /api/products               → สร้างสินค้า
GET    /api/products               → ดูสินค้าทั้งหมด
GET    /api/products/shop/:shopId  → ดูสินค้าของร้านนั้น
GET    /api/products/:id           → ดูสินค้าชิ้นเดียว
PATCH  /api/products/:id           → แก้ไขสินค้า
DELETE /api/products/:id           → ลบสินค้า
```

**Product Schema (MongoDB):**
```
products collection:
  name         string (ต้องมี)
  description  string
  price        number (ต้องมี, ต่ำสุด 0)
  stock        number (default: 0, ต่ำสุด 0)
  isActive     boolean (default: true)
  shop         ObjectId → อ้างอิงไปที่ shops collection
  createdAt    Date
  updatedAt    Date
```

---

## Module Order — จัดการคำสั่งซื้อ

ทุก API ต้องแนบ token

```
POST   /api/orders              → สร้างคำสั่งซื้อ
GET    /api/orders              → ดูคำสั่งซื้อทั้งหมด (?shopId=&status=&customerId=)
GET    /api/orders/:id          → ดูคำสั่งซื้อชิ้นเดียว
PATCH  /api/orders/:id          → แก้ status หรือ note
PATCH  /api/orders/:id/cancel   → ยกเลิกคำสั่งซื้อ
```

**Order Schema (MongoDB):**
```
orders collection:
  shop           ObjectId → อ้างอิงไปที่ shops collection
  user           ObjectId → อ้างอิงไปที่ users collection
  items          Array ของ OrderItem (ดูด้านล่าง)
  status         enum: pending / confirmed / shipped / delivered / cancelled
  totalAmount    number (ต่ำสุด 0)
  shippingAddress string (ที่อยู่จัดส่ง)
  note           string (หมายเหตุ เช่น วิธีชำระเงิน)
  createdAt      Date
  updatedAt      Date

OrderItem (ซ้อนอยู่ใน Order):
  product      ObjectId → อ้างอิงไปที่ products collection
  productName  string (เก็บชื่อสินค้าไว้เลย กันสินค้าถูกลบแล้วหายไป)
  unitPrice    number
  quantity     number (ต่ำสุด 1)
  subtotal     number (= unitPrice × quantity)
```

**สร้างคำสั่งซื้อ ทำงานยังไง? (สำคัญมาก)**

```
POST /api/orders
Body: { shopId, items: [{ productId, quantity }], shippingAddress, note }

1. วน Loop ทุก item:
   - หาสินค้าใน DB ด้วย productId
   - ถ้าไม่เจอ หรือ isActive=false → throw NotFoundException
   - ถ้า stock น้อยกว่า quantity → throw BadRequestException
   - คำนวณ subtotal = unitPrice × quantity
   - เก็บ productName ไว้ใน OrderItem (snapshot ณ เวลานั้น)

2. รวม totalAmount = ผลรวม subtotal ทั้งหมด

3. ลด stock สินค้า: product.stock -= quantity

4. สร้าง Order ใน DB ด้วย status='pending'

5. return Order ที่สร้างแล้ว
```

**ยกเลิกคำสั่งซื้อ ทำงานยังไง?**

```
PATCH /api/orders/:id/cancel

1. หา Order ใน DB
2. ถ้า status เป็น 'delivered' หรือ 'cancelled' แล้ว → throw BadRequestException
3. คืน stock สินค้า: product.stock += quantity (วน Loop)
4. เปลี่ยน status เป็น 'cancelled'
5. return Order ที่ updated
```

---

## Flow การทำงานทั้งระบบ — ทีละขั้น

### สถานการณ์ 1: User เปิดเว็บครั้งแรก

```
1. เปิด http://localhost:5173
2. Router Guard เช็ค: มี token ใน localStorage ไหม?
   - ไม่มี → ไปหน้า /login
   - มีแต่ยังไม่มีข้อมูล user → เรียก fetchMe() ก่อน
3. หน้า Login แสดง
4. User กรอก email + password → กด Login
5. auth.store.login() → POST /api/auth/login
6. Backend ตรวจ email+password → สร้าง JWT token
7. Frontend เก็บ token ใน localStorage
8. Router พาไป /shops อัตโนมัติ
```

### สถานการณ์ 2: User ดูร้านค้า

```
1. หน้า /shops โหลด → ShopView.vue
2. onMounted → shopStore.fetchAll()
3. shopStore.fetchAll() → GET /api/shops
4. Backend → shop.service.findAll() → ค้นหาใน MongoDB
5. return รายการร้านค้า
6. Frontend แสดง card ของแต่ละร้าน
7. User คลิกการ์ดร้าน → router.push('/shops/:id')
```

### สถานการณ์ 3: User สร้างคำสั่งซื้อ (3 ขั้นตอน)

```
หน้า /shops/:id/orders/create → ShopCreateOrderView.vue

──── STEP 1: กรอกที่อยู่ผู้รับ ────
1. หน้าโหลด → ดึงข้อมูลร้าน + รายการสินค้า
2. User กรอก: ชื่อผู้รับ, เบอร์โทร, ที่อยู่
3. ตรวจ validate เบอร์โทร (ต้องขึ้น 0, ตัวเลขเท่านั้น, 9-10 หลัก)
4. กด "ถัดไป" → เก็บข้อมูลใน ref ชั่วคราว (recipient)

──── STEP 2: เลือกสินค้า ────
5. แสดง card สินค้าทั้งหมดของร้าน
6. คลิก card → เพิ่มเข้า orderItems (หรือเอาออกถ้าคลิกซ้ำ)
7. ปรับจำนวนได้ (−/+)
8. แสดงตารางสรุปและยอดรวม
9. กด "ถัดไป"

──── STEP 3: ชำระเงิน ────
10. เลือก โอนเงิน หรือ เก็บเงินปลายทาง
11. แสดงสรุปทั้งหมด
12. กด "ยืนยัน" → submitOrder()
13. สร้าง shippingAddress string:
    "ผู้รับ: ชื่อ | โทร: เบอร์ | ที่อยู่: ที่อยู่"
14. สร้าง note string:
    "ชำระเงิน: โอนเงิน" หรือ "ชำระเงิน: เก็บเงินปลายทาง"
15. orderStore.createOrder() → POST /api/orders
16. Backend ตรวจสต็อก → ลดสต็อก → สร้าง Order
17. router.push('/shops/:id/orders')
```

### สถานการณ์ 4: User ดูบิลและแก้สถานะ

```
หน้า /shops/:id/orders → ShopOrdersView.vue

1. โหลดหน้า → ดึงออเดอร์ทั้งหมดของร้านนั้น
   GET /api/orders?shopId=...
2. แสดงตารางออเดอร์
3. User กด "ดูบิล" → billOrder = order (เปิด Modal)
4. Modal แสดงข้อมูลบิล:
   - parseShipping(shippingAddress) → แยก ชื่อ/โทร/ที่อยู่ ออกจาก string
   - parsePayment(note) → แยกวิธีชำระเงินออกจาก string
5. User เลือก status ใหม่จาก Dropdown
   → PATCH /api/orders/:id { status: "confirmed" }
6. User กด "ยกเลิก"
   → PATCH /api/orders/:id/cancel
   → Backend คืน stock สินค้าอัตโนมัติ
```

---

## ข้อมูลไหลอย่างไรระหว่าง Frontend กับ Backend

```
Frontend (Vue)              Backend (NestJS)          Database (MongoDB)
     │                           │                          │
     │  HTTP Request             │                          │
     │ ─────────────────────────►│                          │
     │  GET/POST/PATCH/DELETE    │  Controller รับ Request  │
     │  Header: Bearer token     │         │                │
     │                           │  Service ประมวลผล       │
     │                           │         │                │
     │                           │  Mongoose Query ─────── ►│
     │                           │         │                │
     │                           │         │◄──────────────│
     │  HTTP Response            │         │                │
     │◄──────────────────────────│  return JSON             │
     │  JSON data                │                          │
     │         │                 │                          │
     │  Store อัพเดต             │                          │
     │         │                 │                          │
     │  Vue render หน้าใหม่      │                          │
```

---

## JWT Token คืออะไร และใช้ยังไง?

JWT = JSON Web Token คือ "บัตรประจำตัว" ที่ Backend สร้างให้หลัง Login

**เนื้อหาข้างใน token (payload):**
```json
{
  "sub": "userId123",
  "email": "user@gmail.com",
  "role": "user"
}
```

**Flow การใช้งาน:**
```
1. Login สำเร็จ → ได้ token
2. เก็บ token ใน localStorage
3. ทุก request ที่ยิงไป Backend → api.ts แนบ token ไปใน Header อัตโนมัติ
4. Backend (JwtGuard) → ตรวจ token ว่าถูกต้องไหม
5. ถ้าถูก → ดึง userId ออกมาจาก token → ส่งต่อให้ Controller
6. ถ้าผิด → return 401 Unauthorized
```

---

## สรุป API ทั้งหมด

### Auth
| Method | Path | ต้อง Token | ทำอะไร |
|--------|------|-----------|--------|
| POST | /api/auth/register | ❌ | สมัครสมาชิก |
| POST | /api/auth/login | ❌ | เข้าสู่ระบบ |
| GET | /api/auth/me | ✅ | ดูข้อมูลตัวเอง |
| GET | /api/auth/google | ❌ | Login ด้วย Google |

### Users
| Method | Path | ต้อง Token | ทำอะไร |
|--------|------|-----------|--------|
| GET | /api/users/me | ✅ | ดูโปรไฟล์ |
| PATCH | /api/users/me | ✅ | แก้โปรไฟล์ |
| POST | /api/users/me/addresses | ✅ | เพิ่มที่อยู่ |
| PATCH | /api/users/me/addresses/:id | ✅ | แก้ที่อยู่ |
| DELETE | /api/users/me/addresses/:id | ✅ | ลบที่อยู่ |
| PATCH | /api/users/me/addresses/:id/default | ✅ | ตั้งที่อยู่หลัก |

### Shops
| Method | Path | ต้อง Token | ทำอะไร |
|--------|------|-----------|--------|
| GET | /api/shops | ❌ | รายการร้านค้าทั้งหมด |
| POST | /api/shops | ❌ | สร้างร้านค้า |
| GET | /api/shops/:id | ❌ | ดูร้านค้าชิ้นเดียว |
| PATCH | /api/shops/:id | ❌ | แก้ร้านค้า |
| DELETE | /api/shops/:id | ❌ | ลบร้านค้า |
| GET | /api/shops/:id/customers | ❌ | ดูลูกค้าของร้าน |

### Products
| Method | Path | ต้อง Token | ทำอะไร |
|--------|------|-----------|--------|
| GET | /api/products | ❌ | สินค้าทั้งหมด |
| POST | /api/products | ❌ | สร้างสินค้า |
| GET | /api/products/shop/:shopId | ❌ | สินค้าของร้านนั้น |
| GET | /api/products/:id | ❌ | ดูสินค้าชิ้นเดียว |
| PATCH | /api/products/:id | ❌ | แก้สินค้า |
| DELETE | /api/products/:id | ❌ | ลบสินค้า |

### Orders
| Method | Path | ต้อง Token | ทำอะไร |
|--------|------|-----------|--------|
| POST | /api/orders | ✅ | สร้างคำสั่งซื้อ |
| GET | /api/orders | ✅ | ดูคำสั่งซื้อทั้งหมด |
| GET | /api/orders/:id | ✅ | ดูคำสั่งซื้อชิ้นเดียว |
| PATCH | /api/orders/:id | ✅ | แก้ status/note |
| PATCH | /api/orders/:id/cancel | ✅ | ยกเลิก |

---

## สถานะ Order มีอะไรบ้าง?

```
pending   → รอดำเนินการ  (เพิ่งสร้าง)
    ↓
confirmed → ยืนยันแล้ว
    ↓
shipped   → จัดส่งแล้ว
    ↓
delivered → ส่งถึงแล้ว  (จบแล้ว ยกเลิกไม่ได้)

cancelled → ยกเลิกแล้ว  (ยกเลิกได้ทุกสถานะก่อน delivered)
```

---

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี | หน้าที่ |
|------|-----------|---------|
| Frontend | Vue 3 | สร้าง UI |
| Frontend | TypeScript | ภาษาที่ใช้เขียน |
| Frontend | Pinia | จัดการ State |
| Frontend | Vue Router | จัดการ URL |
| Frontend | Axios | ยิง HTTP Request |
| Backend | NestJS | Framework หลังบ้าน |
| Backend | TypeScript | ภาษาที่ใช้เขียน |
| Backend | Mongoose | เชื่อมต่อ MongoDB |
| Backend | Passport | จัดการ Authentication |
| Backend | JWT | สร้าง/ตรวจ Token |
| Backend | bcrypt | เข้ารหัสรหัสผ่าน |
| Database | MongoDB | เก็บข้อมูล |
