# ChatPulse — Kiến trúc và luồng hoạt động

Tài liệu này mô tả logic hiện tại của dự án:

- `chatpulse`: React 19, TypeScript, Vite, React Router, Axios, Socket.IO Client.
- `api-chatpulse`: NestJS 11, MongoDB/Mongoose, JWT, Socket.IO, Cloudinary.

Backend dùng global prefix `/api`. REST phục vụ xác thực, đọc dữ liệu, phân trang và upload. Socket.IO phục vụ chat, presence và friends realtime.

## 1. Kiến trúc tổng quan

```text
React Client
├── AuthContext             Phiên đăng nhập
├── ChatContext             Hội thoại, tin nhắn, socket events
├── FriendsContext          Bạn bè và lời mời
├── PostsContext            Feed, like, saved posts
├── NotificationsContext    Thông báo trong phiên
├── Axios ───────────────── REST /api ───────────────┐
└── Socket.IO Client ────── Realtime events ─────────┤
                                                     ▼
NestJS API
├── AuthModule, UsersModule, FriendsModule
├── ChatModule, PostsModule
├── MongooseModule ──────── MongoDB
└── CloudinaryModule ────── Cloudinary
```

Các trang `/`, `/saved`, `/messages`, `/notifications`, `/profile` yêu cầu đăng nhập. `/login` và `/register` chỉ dành cho khách.

## 2. Authentication

### Đăng nhập

1. `POST /api/auth/register` kiểm tra email, hash mật khẩu bằng bcrypt và tạo user.
2. `POST /api/auth/login` kiểm tra mật khẩu, trả `accessToken`, `refreshToken`, `user`.
3. Client lưu token trong `sessionStorage` với key `chatpulse_accessToken` và `chatpulse_refreshToken`.
4. Axios interceptor tự thêm `Authorization: Bearer <accessToken>`.

### Refresh token

```text
Request → 401
   ├── đang refresh → vào hàng chờ
   └── chưa refresh → POST /api/auth/refresh
          ├── thành công: lưu token mới, chạy lại request và hàng chờ
          └── thất bại: xóa token, phát auth-unauthorized
```

Refresh token dùng secret riêng. Backend lưu bcrypt hash của token và xoay vòng cả hai token khi refresh. `POST /api/auth/logout` xóa refresh token đã lưu và đặt user `offline`.

| Method | Endpoint             | Chức năng         |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Đăng ký           |
| POST   | `/api/auth/login`    | Đăng nhập         |
| POST   | `/api/auth/refresh`  | Xoay vòng token   |
| POST   | `/api/auth/logout`   | Đăng xuất         |
| GET    | `/api/auth/me`       | Lấy user hiện tại |

## 3. Socket và presence

Client kết nối với `auth: { token }`. Gateway xác thực JWT, lấy `userId` từ `sub`, rồi cho socket vào:

- `user:<userId>` để nhận sự kiện cá nhân.
- Mọi `conversation:<conversationId>` hiện có để nhận tin kể cả khi không mở cuộc chat đó.

Gateway đếm số socket theo user. Socket đầu tiên chuyển user sang `online`; socket cuối cùng ngắt mới chuyển sang `offline`, nên mở nhiều tab không làm presence nhấp nháy. Khi reconnect, backend xác thực và join lại các phòng.

## 4. Gửi tin nhắn

```text
Sender UI                 Gateway / MongoDB                 Receiver UI
   ├─ tạo temp message           │                              │
   ├─ status: sending            │                              │
   └─ sendMessage ──────────────►├─ kiểm tra participant       │
       clientMessageId           ├─ kiểm tra content/file       │
       content/file/replyTo?     ├─ chống trùng                 │
                                 ├─ lưu Message + lastMessage   │
   ◄──── messageReceived ────────┼──── messageReceived ────────►│
   └─ thay temp bằng bản thật    └─ acknowledgement             └─ render
```

Mỗi tin có `clientMessageId` do client tạo. MongoDB có unique index theo `sender + clientMessageId`. Nếu retry sau khi server đã lưu nhưng client chưa nhận phản hồi, backend trả bản ghi cũ thay vì tạo bản sao.

Client chờ acknowledgement tối đa 8 giây. Khi mất kết nối hoặc timeout, tin chuyển thành `failed` và có nút **Gửi lại**. Retry giữ nguyên ID và thông tin reply. Backend từ chối message không có cả nội dung lẫn attachment.

## 5. Lịch sử, seen và typing

`GET /api/conversations/:id/messages?page=1&limit=50` kiểm tra quyền thành viên, loại các tin nằm trong `deletedBy` của user, lấy trang mới nhất và trả theo thứ tự thời gian. Client có nút tải trang cũ hơn, prepend dữ liệu và lọc ID trùng.

Khi mở hội thoại hoặc nhận tin trong hội thoại đang mở, client phát `seenMessage`. Backend đổi các tin của người khác sang `read` và broadcast `messageSeen`.

Typing được debounce 1,5 giây ở client. Backend kiểm tra user thuộc conversation trước khi broadcast. Client tự tắt indicator sau 2 giây để tránh bị treo.

## 6. Reply, reaction, recall và delete

- **Reply:** hỗ trợ một cấp. Backend kiểm tra message gốc thuộc cùng conversation rồi populate nội dung và sender để hiển thị preview.
- **Reaction:** bật/tắt một trong `👍 ❤️ 😂 😮 😢 🎉`; event `messageReactionUpdated` đồng bộ cả phòng.
- **Recall:** chỉ sender được thu hồi. Backend đặt `isRecalled`, thay nội dung và xóa attachment; event `messageRecalled` cập nhật client.
- **Delete message:** thêm user vào `deletedBy`; người khác vẫn thấy tin.

## 7. Conversation 1–1 và nhóm

Chat 1–1 được tái sử dụng nếu đã có conversation với đúng hai participant. Xóa conversation 1–1 chỉ thêm người gọi vào `hiddenBy`, không xóa dữ liệu của đối phương. Khi có tin mới, `hiddenBy` được xóa để conversation xuất hiện lại.

UI tạo nhóm bằng tên nhóm và tối thiểu hai người bạn; backend tự thêm người tạo. Xóa group conversation khiến người gọi rời nhóm. Nếu không còn participant, backend xóa conversation cùng message.

Hiện chưa có owner/admin nhóm, đổi ảnh/tên sau khi tạo hoặc quản lý thành viên sau khi tạo.

## 8. Friends và notifications

Friends dùng REST để đọc và Socket.IO để thay đổi realtime.

| Client → Server        | Payload         |
| ---------------------- | --------------- |
| `sendFriendRequest`    | `{ to }`        |
| `acceptFriendRequest`  | `{ requestId }` |
| `declineFriendRequest` | `{ requestId }` |
| `removeFriend`         | `{ friendId }`  |

| Server → Client         | Ý nghĩa                |
| ----------------------- | ---------------------- |
| `friendRequestReceived` | Có lời mời mới         |
| `friendRequestAccepted` | Lời mời được chấp nhận |
| `friendRequestDeclined` | Lời mời bị từ chối     |
| `friendRemoved`         | Bị hủy kết bạn         |

Nếu hai user gửi lời mời ngược chiều, service tự chuyển quan hệ thành accepted. Notifications hiện được tổng hợp ở frontend từ incoming requests và socket events; trạng thái đọc/xóa chưa lưu trong MongoDB.

## 9. Socket events của chat

| Chiều           | Event                    | Payload                                                                                    |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| Client → Server | `joinConversation`       | `{ conversationId }`                                                                       |
| Client → Server | `leaveConversation`      | `{ conversationId }`                                                                       |
| Client → Server | `sendMessage`            | `{ conversationId, content?, attachmentUrl?, attachmentType?, clientMessageId, replyTo? }` |
| Client → Server | `typing`                 | `{ conversationId, isTyping }`                                                             |
| Client → Server | `seenMessage`            | `{ conversationId }`                                                                       |
| Client → Server | `recallMessage`          | `{ messageId }`                                                                            |
| Client → Server | `toggleReaction`         | `{ messageId, emoji }`                                                                     |
| Server → Client | `messageReceived`        | Message đã populate sender và replyTo                                                      |
| Server → Client | `messageSeen`            | `{ conversationId, seenBy }`                                                               |
| Server → Client | `messageRecalled`        | `{ conversationId, messageId }`                                                            |
| Server → Client | `messageReactionUpdated` | `{ conversationId, messageId, reactions }`                                                 |
| Server → Client | `typing`                 | `{ conversationId, userId, isTyping }`                                                     |
| Server → Client | `userStatusChanged`      | `{ userId, status }`                                                                       |

## 10. REST API

Trừ register, login và refresh, các endpoint sau yêu cầu access token.

### Users và friends

| Method   | Endpoint                         | Chức năng                          |
| -------- | -------------------------------- | ---------------------------------- |
| GET      | `/api/users`                     | Danh sách user, loại user hiện tại |
| GET      | `/api/users/search?q=...`        | Tìm user                           |
| GET      | `/api/users/:id`                 | Hồ sơ công khai                    |
| PUT      | `/api/users/profile`             | Sửa hồ sơ của mình                 |
| PUT      | `/api/users/password`            | Đổi mật khẩu                       |
| PUT      | `/api/users/:id/avatar`          | Upload avatar                      |
| GET/POST | `/api/users/:id/gallery`         | Xem/upload gallery                 |
| POST     | `/api/users/upload`              | Upload attachment                  |
| GET      | `/api/friends`                   | Danh sách bạn bè                   |
| GET      | `/api/friends/requests/incoming` | Lời mời nhận được                  |
| GET      | `/api/friends/requests/sent`     | Lời mời đã gửi                     |
| GET      | `/api/friends/statuses?ids=...`  | Trạng thái quan hệ theo user ID    |

### Conversations

| Method | Endpoint                                           | Chức năng                      |
| ------ | -------------------------------------------------- | ------------------------------ |
| POST   | `/api/conversations`                               | Tạo/lấy chat 1–1 hoặc tạo nhóm |
| GET    | `/api/conversations`                               | Danh sách hội thoại chưa ẩn    |
| GET    | `/api/conversations/:id`                           | Chi tiết hội thoại             |
| GET    | `/api/conversations/:id/messages`                  | Lịch sử có phân trang          |
| DELETE | `/api/conversations/:id`                           | Ẩn chat 1–1 hoặc rời nhóm      |
| DELETE | `/api/conversations/messages/:messageId`           | Xóa tin phía mình              |
| POST   | `/api/conversations/messages/:messageId/recall`    | Thu hồi tin                    |
| POST   | `/api/conversations/messages/:messageId/reactions` | Bật/tắt reaction qua REST      |

### Posts và comments

| Method   | Endpoint                                 | Chức năng                     |
| -------- | ---------------------------------------- | ----------------------------- |
| POST/GET | `/api/posts`                             | Tạo bài / lấy feed phân trang |
| GET      | `/api/posts/saved`                       | Bài đã lưu                    |
| GET      | `/api/posts/:id`                         | Chi tiết bài                  |
| GET      | `/api/posts/user/:userId`                | Bài của user                  |
| POST     | `/api/posts/:id/like`                    | Bật/tắt like                  |
| POST     | `/api/posts/:id/save`                    | Bật/tắt save                  |
| DELETE   | `/api/posts/:id`                         | Xóa theo quyền owner/admin    |
| POST     | `/api/posts/upload`                      | Upload media                  |
| POST/GET | `/api/posts/:id/comments`                | Tạo/lấy bình luận             |
| DELETE   | `/api/posts/:postId/comments/:commentId` | Xóa bình luận theo quyền      |

## 11. Mô hình dữ liệu chính

```text
User: name, email, password, role, avatar, status, refreshTokens[], photoGallery[]

FriendRequest: requester → User, addressee → User, status

Conversation
├── participants[] → User
├── lastMessage → Message
├── isGroup, groupName
└── hiddenBy[] → User

Message
├── conversationId → Conversation, sender → User
├── clientMessageId, content, attachmentUrl, attachmentType
├── replyTo → Message, reactions[] { user, emoji }
├── status, isRecalled
└── deletedBy[] → User

Post: author, content/media, likes[], savedBy[]
Comment: post, author, content
```

## 12. Giới hạn hiện tại

- Voice/video call chỉ là UI mô phỏng, chưa dùng WebRTC.
- Read receipt là trạng thái chung trên message, chưa có mốc đọc từng thành viên nhóm.
- Unread count và notifications chưa lưu bền vững.
- Chưa có tìm kiếm message phía server và chặn user.
- Group chưa có owner/admin và quản lý thành viên.
- Refresh token nằm trong `sessionStorage`, chưa dùng httpOnly cookie.
- REST và Socket.IO chỉ chấp nhận các origin trong `CORS_ORIGINS` (phân tách
  bằng dấu phẩy). Mặc định local là `http://localhost:3000`.
