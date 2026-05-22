# สรุป Flow การทำงานของระบบ (Backend + Frontend)

---

## ภาพรวมระบบ

```
FRONTEND (Vue 3)          HTTP/Axios          BACKEND (NestJS)         MongoDB
localhost:5173      ←──────────────────→    localhost:3000/api    ←──→  Atlas/Local
```

| ฝั่ง     | Framework  | Port | State         | HTTP Client |
|---------|-----------|------|---------------|-------------|
| Frontend | Vue 3 + TS | 5173 | Pinia         | Axios       |
| Backend  | NestJS + TS | 3000 | -             | Mongoose    |

---

# BACKEND

---

## 1. Entry Point — `src/main.ts`

```
main.ts
  └── NestFactory.create(AppModule)   ← สร้างแอป NestJS
  └── CORS → http://localhost:5173    ← อนุญาติให้ frontend เชื่อมได้
  └── prefix ทุก route ด้วย /api      ← ทุก route จะเป็น /api/...
  └── GlobalValidationPipe            ← ตรวจสอบ DTO ทุกตัวอัตโนมัติ
  └── Swagger UI → /api/docs
  └── listen port 3000
```

---

## 2. App Module — `src/app.module.ts`

เป็น root ที่รวมทุก module เข้าด้วยกัน

```
AppModule
  ├── ConfigModule      → อ่าน .env ทั่วทั้งระบบ
  ├── MongooseModule    → เชื่อม MongoDB ด้วย MONGO_URI จาก .env
  ├── AuthModule
  ├── UsersModule
  ├── ShopModule
  └── ProductsModule
```

---

## 3. Auth Flow — `src/auth/`

### โครงสร้างโฟลเดอร์
```
auth/
  ├── auth.module.ts
  ├── auth.controller.ts
  ├── auth.service.ts
  ├── dto/
  │   ├── login.dto.ts
  │   └── register.dto.ts
  ├── strategies/
  │   ├── local.strategy.ts    ← ตรวจสอบ email/password
  │   ├── jwt.strategy.ts      ← ตรวจสอบ JWT token
  │   └── google.strategy.ts   ← Google OAuth
  └── guards/
      ├── local.guard.ts
      ├── jwt.guard.ts
      └── google.guard.ts
```

### Register
```
POST /api/auth/register
  └── (ไม่มี Guard)
  └── auth.controller → authService.register(dto)
        └── bcrypt.hash(password)
        └── usersService.create(data)
        └── authService.login(user)  ← auto-login
              └── JwtService.sign({ sub, email, role })
              └── return { access_token, user }
```

### Login
```
POST /api/auth/login
  └── @UseGuards(LocalGuard)
        └── local.strategy.ts
              └── authService.validateUser(email, password)
                    └── usersService.findByEmail(email)
                    └── bcrypt.compare(password, hash)
              └── return user → req.user
  └── auth.controller → authService.login(req.user)
        └── return { access_token, user }
```

### Google OAuth
```
GET /api/auth/google
  └── @UseGuards(GoogleGuard)
        └── google.strategy.ts → redirect ไป Google

GET /api/auth/google/callback
  └── @UseGuards(GoogleGuard)
        └── google.strategy.ts
              └── authService.validateGoogleUser(profile)
                    └── usersService.findByGoogleId(googleId)
                    └── ถ้าไม่มี → usersService.create(...)
        └── auth.controller → redirect frontend?token=xxx
```

### ดู user ตัวเอง
```
GET /api/auth/me
  └── @UseGuards(JwtGuard)
        └── jwt.strategy.ts
              └── extract "Authorization: Bearer <token>"
              └── verify → return { userId, email, role } → req.user
  └── return req.user
```

---

## 4. Users Module — `src/users/`

```
users/
  ├── users.module.ts      ← exports UsersService ให้ AuthModule ใช้
  ├── users.service.ts
  └── schemas/
      └── user.schema.ts
```

### MongoDB collection `users`
```
User {
  name        String (required)
  email       String (unique, sparse)   ← ว่างได้ถ้า Google login
  password    String (optional)         ← hash ด้วย bcrypt
  googleId    String (unique, sparse)   ← มีแค่ Google login
  avatar      String (optional)
  role        String (default: 'user')
  timestamps  createdAt, updatedAt
}
```

### การเชื่อม
```
auth.module.ts → imports: [UsersModule]
                            ↓
auth.service.ts → constructor(private usersService: UsersService)
```

---

## 5. Shop Module — `src/shop/`

```
shop/
  ├── shop.module.ts
  ├── shop.controller.ts
  ├── shop.service.ts
  ├── dto/
  │   ├── create-shop.dto.ts
  │   └── update-shop.dto.ts
  └── schema/
      └── shop.schema.ts
```

### MongoDB collection `shops`
```
Shop {
  name         String (required)
  address      String (required)
  description  String
}
```

### Routes → Service
```
POST   /api/shops            → shopService.create(dto)
GET    /api/shops?search=    → shopService.findAll(search)  ← regex บน name/description
GET    /api/shops/:id        → shopService.findOne(id)
PUT    /api/shops/:id        → shopService.update(id, dto)  ← full update
PATCH  /api/shops/:id        → shopService.update(id, dto)  ← partial update
DELETE /api/shops/:id        → shopService.delete(id)
```

---

## 6. Products Module — `src/products/`

```
products/
  ├── products.module.ts
  ├── products.controller.ts
  ├── products.service.ts
  ├── dto/
  │   ├── create-product.dto.ts
  │   └── update-product.dto.ts
  └── schemas/
      └── product.schema.ts
```

### MongoDB collection `products`
```
Product {
  name         String (required)
  description  String
  price        Number (required, min: 0)
  stock        Number (default: 0)
  isActive     Boolean (default: true)
  shop         ObjectId → ref: 'Shop'   ← FK เชื่อมไป collection shops
  timestamps   createdAt, updatedAt
}
```

### Routes → Service
```
POST   /api/products              → productsService.create(dto)
GET    /api/products?search=      → productsService.findAll()   + .populate('shop','name')
GET    /api/products/shop/:shopId → productsService.findByShop() + .populate('shop','name')
GET    /api/products/:id          → productsService.findOne()   + .populate('shop','name')
PATCH  /api/products/:id          → productsService.update(id, dto)
DELETE /api/products/:id          → productsService.remove(id)
```

`.populate('shop')` = แทน ObjectId ด้วยข้อมูลจริงจาก collection shops:
```json
"shop": { "_id": "abc123", "name": "ร้านA" }
```

---

## 7. การเชื่อมกันภายใน Backend

```
AppModule
  │
  ├── AuthModule ──── imports ────→ UsersModule
  │       │                              │
  │   auth.service ←── inject ──── users.service
  │       │
  │   jwt.strategy     (verify token จาก header)
  │   local.strategy   (verify password ด้วย bcrypt)
  │   google.strategy  (OAuth กับ Google)
  │
  ├── ShopModule
  │   shop.service ←── MongooseModel(Shop)
  │
  └── ProductsModule
      products.service ←── MongooseModel(Product)
                                │
                            .populate('shop') ──→ join shops collection
```

---

## 8. Swagger

- config อยู่ที่: `src/main.ts`
- เปิดดูที่: `http://localhost:3000/api/docs`
- รองรับ Bearer Token (JWT)
- ยังไม่มี `@ApiTags`, `@ApiOperation`, `@ApiProperty` ใน controllers/DTOs

---

---

# FRONTEND

---

## 9. Entry Point — `src/main.ts`

```
main.ts
  └── createApp(App)
  └── app.use(pinia)     ← state management
  └── app.use(router)    ← Vue Router
  └── app.mount('#app')
```

---

## 10. Routing — `src/router/index.ts`

```
/                   → redirect → /products
/login              → LoginView         (public)
/auth/callback      → AuthCallbackView  (public, รับ token จาก Google)
/products           → ProductsView      (ต้อง login)
/shops              → ShopView          (ต้อง login)
```

### Route Guard (beforeEach)
```
ทุกครั้งที่เปลี่ยนหน้า:
  1. ถ้ามี token แต่ user = null → fetchMe() เพื่อโหลดข้อมูล user
  2. ถ้า route ต้องการ auth และ user = null → redirect /login
```

---

## 11. API Config — `src/services/api.ts`

```typescript
axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})
```

---

## 12. State Management — `src/stores/`

```
stores/
  ├── auth.store.ts      ← จัดการ token, user, login, logout
  ├── product.store.ts   ← จัดการ product list + CRUD
  └── shop.store.ts      ← จัดการ shop list + CRUD
```

### auth.store.ts
```
state:
  token  ← โหลดจาก localStorage('token') ตอน init
  user   ← ข้อมูล user หลัง login

methods:
  login(email, password)
    POST /api/auth/login
    → { access_token, user }
    → เก็บ token ใน localStorage + state

  register(name, email, password)
    POST /api/auth/register
    → { access_token, user }
    → เก็บ token ใน localStorage + state

  fetchMe()
    GET /api/auth/me
    Header: Authorization: Bearer <token>
    → โหลด user object มาเก็บใน state
    → ถ้า fail → logout()

  setToken(t)       ← ใช้รับ token จาก Google OAuth callback
  logout()          ← ล้าง token ใน state + localStorage

computed:
  isLoggedIn = token != null
```

### product.store.ts
```
state:
  products: Product[]
  loading: boolean
  error: string

methods:
  fetchAll(search?)   GET  /api/products?search=...
  createProduct(data) POST /api/products
  updateProduct(id)   PATCH /api/products/:id
  removeProduct(id)   DELETE /api/products/:id
```

### shop.store.ts
```
state:
  shops: Shop[]
  loading: boolean
  error: string

methods:
  fetchAll(search?)  GET  /api/shops?search=...
  createShop(data)   POST /api/shops
  updateShop(id)     PATCH /api/shops/:id
  removeShop(id)     DELETE /api/shops/:id
```

---

## 13. Pages — `src/views/`

### LoginView.vue
```
- form email/password
- toggle Login / Register mode
- ปุ่ม Google Login → redirect /api/auth/google
- เรียก authStore.login() หรือ authStore.register()
- สำเร็จ → push('/products')
```

### AuthCallbackView.vue
```
- รับ token จาก URL: /auth/callback?token=xxxxx
- เรียก authStore.setToken(token)
- เรียก authStore.fetchMe()
- redirect → /products
```

### ProductsView.vue
```
- mount → productStore.fetchAll()
- search (debounce 500ms) → productStore.fetchAll(search)
- แสดงตาราง: name, description, price, stock, shop
- Add → เปิด ProductForm → productStore.createProduct()
- Edit → เปิด ProductForm (prefill) → productStore.updateProduct()
- Delete → productStore.removeProduct()
```

### ShopView.vue
```
- mount → shopStore.fetchAll()
- แสดงรายการร้านค้า
- Add/Edit/Delete shop → shopStore methods
- คลิก shop → GET /api/products/shop/:shopId
  └── แสดง product ของร้านนั้น
  └── สามารถ Add/Edit/Delete product ของร้านได้
```

---

## 14. Components — `src/components/`

### ProductForm.vue
```
Props: editProduct?: Product | null
Emits: submit(payload), cancel()
- mount → shopStore.fetchAll() (โหลด shop dropdown)
- fields: name, description, price, stock, shopId
```

---

## 15. Types — `src/types/`

```typescript
// product.type.ts
Product {
  _id, name, description, price, stock, isActive
  createdAt, updatedAt
  shop?: { _id: string; name: string }  ← populated จาก backend
}
CreateProductPayload { name, description?, price, stock?, shopId? }
UpdateProductPayload { name?, description?, price?, stock?, shopId? }

// shop.type.ts
Shop { _id, name, address, description? }
```

---

---

# การเชื่อมกัน Frontend ↔ Backend

---

## 16. Flow ทั้งหมดแบบ End-to-End

### Login
```
[LoginView] กรอก email/password
    ↓ authStore.login()
    ↓ POST http://localhost:3000/api/auth/login
    ↓ [LocalGuard] → local.strategy → validateUser → bcrypt.compare
    ↓ authService.login() → JwtService.sign()
    ↓ response: { access_token, user }
    ↓ เก็บ token → localStorage + pinia state
    ↓ router.push('/products')
```

### Google OAuth
```
[LoginView] คลิก "Login with Google"
    ↓ redirect → GET /api/auth/google
    ↓ [GoogleGuard] → redirect ไป accounts.google.com
    ↓ user ยืนยัน → Google redirect กลับ /api/auth/google/callback
    ↓ google.strategy → validateGoogleUser → find/create user ใน DB
    ↓ authService.login() → สร้าง token
    ↓ backend redirect → http://localhost:5173/auth/callback?token=xxx
    ↓ [AuthCallbackView] รับ token → setToken() → fetchMe()
    ↓ router.push('/products')
```

### ดึงสินค้า
```
[ProductsView] mount
    ↓ productStore.fetchAll()
    ↓ GET http://localhost:3000/api/products
    ↓ productsController.findAll()
    ↓ productsService.findAll().populate('shop','name')
    ↓ MongoDB query → products collection + join shops
    ↓ response: Product[] (มี shop.name ติดมาด้วย)
    ↓ เก็บใน productStore.products
    ↓ Vue render ตาราง
```

### สร้างสินค้า
```
[ProductsView] คลิก Add → เปิด ProductForm
    ↓ ProductForm mount → shopStore.fetchAll() (โหลด shop dropdown)
    ↓ กรอกข้อมูล submit
    ↓ productStore.createProduct(payload)
    ↓ POST http://localhost:3000/api/products  { name, price, shopId, ... }
    ↓ productsController.create()
    ↓ productsService.create() → shopId string → ObjectId → save
    ↓ response: Product ใหม่
    ↓ เพิ่มเข้า productStore.products
    ↓ Vue re-render ตาราง
```

### ดู product ของร้าน (ShopView)
```
[ShopView] คลิกเลือกร้าน
    ↓ GET http://localhost:3000/api/products/shop/:shopId
    ↓ productsService.findByShop(shopId).populate('shop','name')
    ↓ response: Product[] ของร้านนั้น
    ↓ แสดงใน ShopView
```

### Route Guard (ป้องกัน unauthorized)
```
เปลี่ยน route ทุกครั้ง:
    ↓ router.beforeEach()
    ↓ ถ้า token อยู่ใน localStorage แต่ user = null
        → GET /api/auth/me  Header: Authorization: Bearer <token>
        → jwt.strategy verify token
        → return { userId, email, role }
        → เก็บใน authStore.user
    ↓ ถ้า route requiresAuth และ user = null
        → redirect /login
```

---

## 17. สรุปการเชื่อมทั้งหมด

```
FRONTEND                           BACKEND                        MongoDB
─────────────────────────────────────────────────────────────────────────
auth.store
  login()          ──POST /auth/login──→  LocalGuard
  register()       ──POST /auth/register→  AuthController
  fetchMe()        ──GET  /auth/me──────→  JwtGuard            users
  setToken()       ←──redirect+token────  GoogleStrategy
                                                ↕
                                          UsersService  ────────→ users

product.store
  fetchAll()       ──GET  /products─────→  ProductsController
  createProduct()  ──POST /products─────→  ProductsService     products
  updateProduct()  ──PATCH /products/:id→  ProductsService  ←populate→ shops
  removeProduct()  ──DELETE /products/:id→ ProductsService

shop.store
  fetchAll()       ──GET  /shops────────→  ShopController
  createShop()     ──POST /shops────────→  ShopService         shops
  updateShop()     ──PATCH /shops/:id───→  ShopService
  removeShop()     ──DELETE /shops/:id──→  ShopService

Token Flow:
  login → localStorage('token')
  ทุก request ที่ต้องการ auth → Header: Authorization: Bearer <token>
  jwt.strategy verify → req.user = { userId, email, role }
```

---

## 18. Swagger

- config: `backend/src/main.ts`
- เปิดดูที่: `http://localhost:3000/api/docs`
- รองรับ Bearer Token (JWT)
- ยังไม่มี `@ApiTags`, `@ApiOperation`, `@ApiProperty` ใน controllers/DTOs
