# TÀI LIỆU KIẾN TRÚC & LUỒNG HOẠT ĐỘNG CHAT PULSE (AUTHENTICATION & REALTIME FLOWS)

Tài liệu này giải thích chi tiết luồng giao tiếp giữa React Frontend và NestJS Backend đối với Authentication (Xác thực) và Realtime Chat (Tin nhắn thời gian thực).

> **Ghi chú**: Mọi REST endpoint đều nằm dưới global prefix **`/api`** (ví dụ `POST /api/auth/login`).

---

## 1. Luồng Xác thực (Authentication Flow)

```
+-------------------+                    +--------------------+                    +------------------+
|   React Frontend  |                    |   NestJS Backend   |                    |  MongoDB Database|
+-------------------+                    +--------------------+                    +------------------+
          |                                        |                                         |
          |----- (1) POST /api/auth/login -------->|    { email, password }                    |
          |                                        |----- (2) bcrypt.compare + findByEmail --->|
          |                                        |<---- (3) User hợp lệ ---------------------|
          |                                        |                                         |
          |<---- (4) Trả về accessToken & ----------|                                         |
          |   refreshToken (JSON body)             |  + lưu bcrypt hash refreshToken vào          |
          |                                        |    user.refreshTokens                        |
[Lưu CẢ 2 token vào sessionStorage]                |                                         |
[chatpulse_accessToken / _refreshToken]            |                                         |
          |                                        |                                         |
          |----- (5) Gửi Request có Auth Guard ---->|                                         |
          |      (Headers: Bearer accessToken)     |                                         |
          |                                        |----- (6) Xác thực JWT hợp lệ ---------->|
          |<---- (8) Phản hồi dữ liệu 200 OK ------|                                            |
          |                                        |                                         |
      [accessToken]                                |                                         |
        [hết hạn]                                  |                                         |
          |                                        |                                         |
          |----- (9) Gửi Request bất kỳ ----------->|                                         |
          |<---- (10) Lỗi 401 Unauthorized --------|                                         |
          |                                        |                                         |
  [Axios Interceptor]                              |                                         |
  [bắt 401, giữ request vào hàng chờ]              |                                         |
          |                                        |                                         |
          |--- (11) POST /api/auth/refresh ------->|                                         |
          |    { refreshToken } (body JSON)        |                                         |
          |                                        |-- (12) JwtRefreshGuard: verify JWT + ------->|
          |                                        |    bcrypt.compare hash trong DB           |
          |                                        |<-- (13) refreshToken hợp lệ ---------------|
          |<---- (14) accessToken MỚI + -----------|                                         |
          |   refreshToken mới (rotation)          |  + lưu hash refreshToken MỚI                |
   [Cập nhật sessionStorage]                       |                                         |
   [Giải phóng hàng chờ, gửi lại request]          |                                         |
          |                                        |                                         |
      [refreshToken cũng hết hạn]                  |                                         |
          |----- (15) /api/auth/refresh lỗi 401 -->|                                         |
   [Xóa sessionStorage]                            |                                         |
   [dispatch 'auth-unauthorized']                  |                                         |
          |                                        |                                         |
   [AppContext bắt sự kiện -> logout]              |  - Ngắt socket, xóa state               |
          |                                        |                                          |
   [Đăng xuất (Logout)]                            |                                         |
          |--- (16) POST /api/auth/logout --------->|                                         |
          |     (Bearer accessToken)                 |-- xóa refreshTokens + set status ------->|
          |                                        |    'offline'                              |
          |<---- (17) 200 OK ----------------------|                                         |
   [Xóa sessionStorage + state + ngắt socket]      |                                         |
```

### Chi tiết các bước:

1. **Đăng nhập**: React gửi `{ email, password }` tới `POST /api/auth/login`.
2. **Backend xử lý**: NestJS băm/so sánh password bằng `bcrypt`. Nếu đúng, tạo:
   - **Access Token** (hạn ngắn, `JWT_EXPIRES_IN`, mặc định `1h`), ký bằng `JWT_SECRET`.
   - **Refresh Token** (hạn dài, `JWT_REFRESH_EXPIRES_IN`, mặc định `7d`), ký bằng `JWT_REFRESH_SECRET`. Hash của token này được lưu vào `user.refreshTokens` trong DB.
3. **Response**: trả về `{ accessToken, refreshToken, user }`.
4. **React lưu trữ**: **cả hai token lưu trong `sessionStorage`** (key `chatpulse_accessToken`, `chatpulse_refreshToken`). Không sử dụng httpOnly cookie.
5. **Gửi token**: `Axios request interceptor` tự đính kèm `Authorization: Bearer <accessToken>` (xem `src/services/api.ts`).
6. **Access Token hết hạn (xử lý 401)**:
   - Backend trả `401`. `Axios response interceptor` giữ request lỗi vào hàng chờ (queue).
   - Client gọi `POST /api/auth/refresh` với **body JSON `{ refreshToken }`**.
   - `JwtRefreshGuard` (strategy `jwt-refresh`) verify chữ ký token, rồi `bcrypt.compare` với hash trong DB.
   - Nếu hợp lệ, backend ký **cặp token mới** (rotation) và cập nhật hash mới vào DB.
   - Interceptor cập nhật `sessionStorage`, giải phóng hàng chờ và tự gửi lại những request đang đợi.
7. **Refresh Token hết hạn / bị thu hồi**:
   - Nếu `/api/auth/refresh` trả `401`, client xóa `sessionStorage`, phát sự kiện `auth-unauthorized`.
   - `AppContext` bắt sự kiện → thực hiện logout: xóa state, ngắt socket, đưa về trang Login.
8. **Đăng xuất (Logout)**:
   - Client gọi `POST /api/auth/logout` (có JWT guard). Backend xóa toàn bộ refresh tokens trong DB.
   - *Fallback*: backend cũng set user `status: "offline"` phòng khi socket chưa kịp disconnect.
   - Client xóa sạch `sessionStorage` và state.

---

## 2. Luồng Chat Realtime (Realtime Chat Flow)

Kiến trúc realtime dùng **Socket.IO**: `ChatGateway` (NestJS `@nestjs/websockets`) chạy chung HTTP server với REST. Việc **ghi DB vẫn qua `ChatService`** (bảo toàn dữ liệu), Socket.IO chỉ thêm lớp phát tán tức thời. REST giữ vai trò đọc lịch sử, phân trang, xóa.

```
  User A (React)               NestJS Gateway / ChatService          User B (React)
      |                                                                    |
      |-- socket connect (auth: { token }) --> verify JWT -> userId         |
      |                              |-- join user:${userId}                |
      |                              |-- join MỌI conversation của user      |
      |                              |-- status: online + broadcast          |
      |                              |      'userStatusChanged'              |
      |                                                                       |
  ---- Gửi tin nhắn ----                                                      |
      |-- emit 'sendMessage' { conversationId, content, ... } ->|             |
      |                              |-- ChatService.createMessage -----------> (ghi DB + lastMessage)
      |                              |-- emit 'messageReceived' tới            |
      |                              |   room conversation:${conversationId}   |
      |<-- echo 'messageReceived' ---|                             |<--------- 'messageReceived'
      |   (thay thế message optimistic)                              |-- render tin mới       
      |                                                                      |
---- User B mở conversation / nhận tin ----                                    |
      |                              |                                        |-- emit 'seenMessage'
      |                              |-- mark → status: "read" nếu có                             |
      |                              |-- emit 'messageSeen' tới room          |
      |<-- 'messageSeen' (CheckCheck xanh) |                                  |
      |                                                                      |
---- Gõ chữ ----
      |-- emit 'typing' { conversationId, isTyping } -> broadcast room        |
      |                                                                       |-- 'typing' -> hiện "đang nhập"
  ---- Đóng bảng / mất mạng ----                                              |
      |                       handleDisconnect -> status: 'offline' + broadcast |
      |                                                               |<-- 'userStatusChanged'
```

### Chi tiết các bước gửi nhận tin nhắn:

1. **Kết nối (Connection)**:
   - Sau đăng nhập / khi trang load lại (còn token hợp lệ), React mở socket với `auth: { token }` (xem `src/services/socket.service.ts`).
   - Gateway `handleConnection`: `jwtService.verifyAsync` lấy `userId`; join phòng `user:${userId}` VÀ tất cả phòng `conversation:${id}` của các conversation của user (để nhận tin nơi không mở màn hình Chat).
   - Đếm số kết nối/user (`connectionCounts`) chống flicker đa tab: **kết nối đầu tiên** set `status: "online"` + broadcast `userStatusChanged { userId, status: 'online' }`.
   - Đóng tab (hoặc logout): `handleDisconnect` giảm đếm; khi về `0` → `status: "offline"` + broadcast `userStatusChanged`.
2. **Gửi tin nhắn (sendMessage)**:
   - User A nhập nội dung → `handleSendMessage`. UI **append luôn 1 message "optimistic"** (tick x1) hiển thị ngay.
   - Đồng thời socket emit `sendMessage` với `{ conversationId, content, attachmentUrl?, attachmentType? }`.
   - Gateway gọi `ChatService.createMessage()` ghi vào MongoDB (fields: `conversationId`, `sender`, `content`, `attachmentUrl`, `attachmentType`, `status: "sent"`, `isRecalled`, `deletedBy`, timestamps), đồng thời cập nhật `conversation.lastMessage`.
   - Gateway emit `messageReceived` tới room `conversation:${conversationId}` (gồm cả sender).
   - Client User A nhận echo → **thay thế message optimistic** (match theo content) để có `_id` thật; User B nhận và append vào `messages[conversationId]`, cập nhật preview `lastMessage` của conversation.
3. **Đánh dấu đã đọc (seen)**:
   - Khi User B mở conversation hoặc nhận được tin mới khi đang mở, B emit `seenMessage { conversationId }`.
   - Gateway `handleSeenMessage` → `ChatService.markMessagesRead` (đánh `status: "read"` cho các tin của đối phương chưa đọc) và nếu vẫn còn → emit `messageSeen { conversationId, seenBy }` tới cả phòng.
   - User A nhận `messageSeen` → đổi `status: 'read'` trên tin của mình (CheckCheck chuyển màu xanh).
4. **Thu hồi tin nhắn (recall)**:
   - User A bấm thu hồi → frontend gọi REST `POST /api/conversations/messages/:id/recall` (backend kiểm tra quyền), đồng thời emit `recallMessage { messageId }` để báo realtime.
   - Gateway `recallMessage` cũng đảm bảo, emit `messageRecalled { conversationId, messageId }` tới phòng; cả A và B đều đổi UI thành "Tin nhắn đã bị thu hồi".
5. **Typing Indicator**:
   - User A gõ chữ → `handleMessageChange` gọi emit `typing { conversationId, isTyping: true }` (debounce, chỉ gửi ở nhịp đầu tiên), gateway broadcast tới phòng (không gửi về người gửi).
   - User B nhận một `isTyping: true` → hiện "Đang nhập..."; tự động tắt sau 2s (hoặc khi nhận `isTyping: false`).
6. **Lịch sử tin nhắn & phân trang**:
   - Đọc lại lịch sử qua REST: `GET /api/conversations/:id/messages?page=N&limit=M` (mặc định 50 tin; sắp xếp tăng dần).
   - Xóa là **soft delete**: `DELETE /api/conversations/messages/:messageId` thêm userId vào mảng `deletedBy`; các message bị xóa không hiện cho user đó nữa.

---

## 3. Các sự kiện Realtime (Event Summary)

### Client → Server (emit):

| Event            | Payload                                                                 |
|------------------|-------------------------------------------------------------------------|
| `joinConversation`  | `{ conversationId }` — vào phòng chat                                   |
| `leaveConversation` | `{ conversationId }` — rời phòng chat (khi chuyển màn khác)             |
| `sendMessage`       | `{ conversationId, content?, attachmentUrl?, attachmentType? }`         |
| `typing`            | `{ conversationId, isTyping }`                                          |
| `seenMessage`       | `{ conversationId }`                                                    |
| `recallMessage`     | `{ messageId }`                                                         |

### Server → Client (emit)

| Event            | Payload | Mô tả                                                   |
|------------------|----------------------------------------------------------------------------------|
| `messageReceived`  | message (populate sender) | Có ai trong phòng gửi tin mới        |
| `messageSeen`      | `{ conversationId, seenBy }` | Sender biết tin của mình đã đọc     |
| `messageRecalled`  | `{ conversationId, messageId }` | Tin trong phòng bị thu hồi        |
| `typing`           | `{ conversationId, userId, isTyping }` | Đối phương đang gõ             |
| `userStatusChanged` | `{ userId, status: 'online' \| 'offline' }` | Presence realtime   |

### Presence (Online/Offline)

- Trạng thái được đặt theo **socket connection**: kết nối đầu → online, kết nối cuối → offline (multi-tab an toàn).
- Cũng được set **fallback khi logout** ở backend (`AuthService.logout`).
- Client các user khác cập nhật `participantStatus` của conversation khi nhận `userStatusChanged` → chấm xanh / "Active Now" / "Offline" trên `Messages.tsx`.