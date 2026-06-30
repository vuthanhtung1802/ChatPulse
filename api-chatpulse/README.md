nestjs/
├── src/
│ ├── app.module.ts # Module gốc, cấu hình ConfigModule và MongooseModule (MongoDB Atlas)
│ ├── main.ts # Entry point, bật CORS, ValidationPipe toàn cục
│ ├── auth/ # Module xác thực & quản lý phiên
│ │ ├── dto/ # LoginDto, RegisterDto (áp dụng Validation)
│ │ ├── guards/ # JwtAuthGuard bảo vệ API
│ │ ├── strategies/ # JwtStrategy giải mã token từ Authorization header
│ │ ├── auth.controller.ts # Endpoint login, register, profile, users
│ │ ├── auth.service.ts # Logic băm password (bcrypt), sinh JWT, tìm kiếm user
│ │ └── auth.module.ts # Đăng ký Passport, JwtModule, MongooseModule cho User
│ ├── users/ # Module người dùng
│ │ ├── schemas/ # User Schema (Mongoose) lưu username, password, displayName, avatar
│ │ ├── users.service.ts # Tìm kiếm, tạo người dùng trong Database
│ │ └── users.module.ts # Đăng ký UserSchema cho Mongoose
│ └── chat/ # Module nhắn tin thời gian thực (Real-time Chat)
│ ├── schemas/ # ConversationSchema & MessageSchema
│ ├── dto/ # CreateConversationDto, CreateMessageDto
│ ├── chat.gateway.ts # WebSocket Gateway (Socket.io) handle online users, join/leave room, typing, sendMessage
│ ├── chat.controller.ts # HTTP Controller cho quản lý hội thoại và tin nhắn
│ ├── chat.service.ts # Lưu tin nhắn, tìm hội thoại, tự động tìm/tạo chat 1-1
│ └── chat.module.ts # Đăng ký các Model hội thoại & Gateway
├── .env # Chứa cấu hình kết nối DB (MONGO_URI) và JWT_SECRET
├── tsconfig.json # Cấu hình TypeScript compiler
└── tsconfig.build.json # Cấu hình Build cho Nest CLI
