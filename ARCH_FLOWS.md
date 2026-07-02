# TÀI LIỆU KIẾN TRÚC & LUỒNG HOẠT ĐỘNG CHAT PULSE (AUTHENTICATION & REALTIME FLOWS)

Tài liệu này giải thích chi tiết luồng giao tiếp giữa React Frontend và NestJS Backend đối với Authentication (Xác thực) và Realtime Chat (Tin nhắn thời gian thực).

---

## 1. Luồng Xác thực (Authentication Flow)

```
+-------------------+                    +--------------------+                    +------------------+
|   React Frontend  |                    |   NestJS Backend   |                    |  MongoDB Database|
+-------------------+                    +--------------------+                    +------------------+
          |                                        |                                         |
          |----- (1) Đăng ký / Đăng nhập --------->|                                         |
          |      (POST /auth/login)                |                                         |
          |                                        |----- (2) Kiểm tra mật khẩu & User ---->|
          |                                        |<---- (3) Trả về thông tin User ---------|
          |                                        |                                         |
          |<---- (4) Trả về Access Token ----------|                                         |
          |          & Cookie Refresh Token (Http) |                                         |
          |                                        |                                         |
[Lưu Access Token]                                 |                                         |
[Vào localStorage]                                 |                                         |
          |                                        |                                         |
          |----- (5) Gửi Request có Auth Guard ---->|                                         |
          |      (Headers: Bearer AccessToken)     |                                         |
          |                                        |----- (6) Xác thực JWT hợp lệ ---------->|
          |                                        |<---- (7) Trả về dữ liệu yêu cầu --------|
          |<---- (8) Phản hồi dữ liệu 200 OK ------|                                         |
          |                                        |                                         |
          |                                        |                                         |
     [AccessToken]                                 |                                         |
       [Hết Hạn]                                   |                                         |
          |                                        |                                         |
          |----- (9) Gửi Request bất kỳ ----------->|                                         |
          |<---- (10) Lỗi 401 Unauthorized --------|                                         |
          |                                        |                                         |
  [Axios Interceptor]                              |                                         |
  [Tự động bắt lỗi 401]                            |                                         |
  [Tạm dừng hàng chờ]                              |                                         |
          |                                        |                                         |
          |----- (11) Refresh Token Request ------->|                                         |
          |      (POST /auth/refresh)              |                                         |
          |      (Kèm Cookie RefreshToken)         |----- (12) Verify RefreshToken (DB) ---->|
          |                                        |<---- (13) RefreshToken hợp lệ ----------|
          |<---- (14) Trả về AccessToken mới ------|                                         |
[Lưu AccessToken mới]                              |                                         |
[Giải phóng hàng chờ]                              |                                         |
          |                                        |                                         |
          |----- (15) Tự động gửi lại request ---->|                                         |
          |<---- (16) Phản hồi dữ liệu thành công -|                                         |
          |                                        |                                         |
```

### Chi tiết các bước:

1. **User Đăng nhập**: React gửi credentials (email/password) tới `/auth/login` ở NestJS.
2. **Xử lý ở Backend**: NestJS băm/so sánh password bằng `bcrypt`. Nếu đúng, nó tạo ra:
   - **Access Token** (hạn ngắn, ví dụ 15 phút), ký bằng JWT secret.
   - **Refresh Token** (hạn dài, ví dụ 7 ngày), ký bằng JWT secret khác và lưu hash vào DB của User để kiểm soát phiên.
3. **Phản hồi**:
   - Backend gửi trả Access Token trong JSON response body.
   - Backend set cookie `refreshToken` trong HTTP Header với các thuộc tính bảo mật: `httpOnly: true`, `secure: true`, `sameSite: 'strict'`, `path: '/auth/refresh'`. Nhờ `httpOnly`, javascript frontend KHÔNG THỂ đọc được cookie này, giúp chống tấn công XSS.
4. **React lưu trữ**:
   - React nhận JSON chứa `accessToken`, lưu vào `localStorage.setItem('chatpulse_accessToken', token)`.
   - Cookie `refreshToken` tự động được trình duyệt lưu trữ và quản lý.
5. **Gửi Token**: Mỗi khi React gửi request API bằng Axios, một `request interceptor` sẽ tự động đính kèm header: `Authorization: Bearer <accessToken>`.
6. **Access Token hết hạn (Xử lý lỗi 401)**:
   - Nếu Access Token hết hạn, Backend trả về mã lỗi `401 Unauthorized`.
   - `response interceptor` của Axios phát hiện mã `401`. Nó sẽ giữ lại request bị lỗi vào một hàng chờ (queue).
   - Axios gửi một request ẩn `/auth/refresh` bằng phương thức POST. Trình duyệt tự động đính kèm cookie `refreshToken` lên.
   - NestJS kiểm tra Refresh Token đó trong DB. Nếu hợp lệ, nó ký một `accessToken` mới và gửi về cho client.
   - Axios nhận token mới, cập nhật vào localStorage, thay đổi Header mặc định và gửi lại tất cả các request đang đợi trong hàng chờ một cách mượt mà (User không hề nhận ra sự gián đoạn).
7. **Refresh Token hết hạn hoặc bị thu hồi**:
   - Nếu `/auth/refresh` cũng trả về lỗi `401` (nghĩa là Refresh Token đã hết hạn hoặc bị xóa trên DB), React sẽ thực hiện quy trình Logout cưỡng bức: Xóa Access Token trong localStorage, ngắt kết nối Socket.IO, xóa Context State và đưa người dùng về trang Login.
8. **Đăng xuất (Logout)**:
   - Client gửi POST `/auth/logout`.
   - Backend xóa Refresh Token trong DB và set cookie `refreshToken` hết hạn ngay lập tức (Clear cookie).
   - Client xóa sạch localStorage và state.

---

## 2. Luồng Chat Realtime (Chat Realtime Flow)

Quy trình gửi nhận tin nhắn Realtime kết hợp REST API (để đảm bảo ghi DB an toàn, transaction ổn định) và Socket.IO (để phát tán sự kiện tức thời).

```
  User A (React)             NestJS Server / Gateway          User B (React)
    |                                   |                           |
    |---- (1) REST POST /chat/messages ->|                           |
    |     { text: "Hello", convId }     |                           |
    |                                   |-- (2) Lưu DB MongoDB ---->|
    |                                   |<-- (3) DB phản hồi OK ----|
    |                                   |                           |
    |                                   |-- (4) Emit sự kiện ------>|
    |                                   |   "messageReceived"       |
    |                                   |   tới room/User B         |
    |                                   |                           |
    |<--- (5) Phản hồi REST 201 --------|                           |<-- (6) Nhận tin nhắn và --|
    |     (Thêm vào UI với Tick x1)     |                           |    render lên giao diện  |
    |                                   |                           |                          |
    |                                   |<-- (7) Socket emit -------|
    |                                   |    "seen" (đã đọc)        |
    |                                   |                           |
    |<--- (8) Nhận sự kiện "seen" ------|                           |
    |     (Cập nhật UI Tick thành x2)   |                           |
```

### Chi tiết các bước gửi nhận tin nhắn:

1. **User A gửi tin nhắn**:
   - User A nhập chữ và nhấn Gửi.
   - React gọi API `chatService.sendMessage(conversationId, text)`. Đồng thời tạo một message tạm thời hiển thị trên UI với trạng thái "Đang gửi".
2. **NestJS Backend xử lý**:
   - `/chat/messages` nhận request chứa nội dung tin nhắn và ID cuộc trò chuyện.
   - Message Service xác thực người gửi qua JWT, lưu tin nhắn vào MongoDB (bao gồm: `senderId`, `conversationId`, `text`, `attachmentUrl`, `status: "delivered"`).
   - Message Service cập nhật `lastMessageText`, `lastMessageTime`, và `lastMessageUnread: true` trong collection `Conversation`.
3. **Phát tán tin nhắn qua Socket.IO**:
   - Sau khi ghi MongoDB thành công, Gateway sẽ phát một sự kiện socket `messageReceived` tới phòng chat của Conversation đó: `this.server.to(conversationId).emit('messageReceived', newMessage)`.
   - Nhờ vậy, tất cả những người đang kết nối trong cuộc trò chuyện đó (bao gồm User B) đều nhận được dữ liệu tin nhắn mới.
4. **React User B cập nhật giao diện**:
   - Socket.IO client của User B nhận được sự kiện `messageReceived`.
   - Reducer/State trong `AppContext` cập nhật: append tin nhắn mới vào mảng `messages[conversationId]`.
   - Đồng thời, cập nhật tin nhắn cuối cùng hiển thị trên Chat List của User B.
5. **Đánh dấu Đã đọc (Seen)**:
   - Khi User B đang mở màn hình chat với User A, ngay khi tin nhắn mới xuất hiện hoặc khi User B click vào hội thoại, React User B sẽ bắn một sự kiện Socket `seenMessage` gửi kèm `{ conversationId, messageId }`.
   - Gateway nhận sự kiện, cập nhật trạng thái tin nhắn trong MongoDB thành `status: "seen"`.
   - Server phát ngược lại cho User A sự kiện `messageSeen` để User A chuyển biểu tượng tích xám thành tích xanh (Đã xem).

---

## 3. Các Trạng thái Realtime Khác (Online/Offline, Typing)

### Trạng thái Online / Offline:

- **Kết nối (Connection)**: Khi User đăng nhập thành công, React kết nối Socket.IO kèm token. NestJS Gateway verify token tại `handleConnection(client)`, lấy ra `userId`, lưu cặp `socket.id -> userId` vào RAM (hoặc Redis) và cập nhật trạng thái User trong MongoDB là `status: "online"`. Gateway broadcast sự kiện `userStatusChanged` gửi kèm `{ userId, status: 'online' }` cho toàn bộ các client khác để cập nhật dấu chấm xanh lá.
- **Ngắt kết nối (Disconnection)**: Khi đóng tab hoặc mất mạng, socket tự ngắt kết nối. Gateway chạy `handleDisconnect(client)`, tìm `userId` tương ứng, cập nhật MongoDB thành `status: 'offline'`, và broadcast sự kiện `userStatusChanged` gửi kèm `{ userId, status: 'offline' }`.

### Chỉ báo đang nhập chữ (Typing Indicator):

- Khi User A gõ chữ vào ô input, React kích hoạt hàm `handleInputChange`. Hàm này gửi sự kiện socket `typing` gửi kèm `{ conversationId, isTyping: true }`.
- Gateway nhận sự kiện và gửi tiếp (broadcast) tới room chat: `client.to(conversationId).emit('typing', { conversationId, userId, isTyping: true })`.
- React User B lắng nghe sự kiện `typing`, cập nhật state `isTyping[conversationId] = true` và hiển thị bong bóng động ba dấu chấm nhấp nháy.
- Khi User A dừng gõ quá 1.5 giây hoặc nhấn nút gửi, React User A gửi sự kiện `typing` gửi kèm `isTyping: false`. Trạng thái ở client User B được dọn sạch và ẩn bong bóng đi.
