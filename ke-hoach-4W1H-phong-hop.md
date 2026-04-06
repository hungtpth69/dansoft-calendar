# Kế hoạch 4W1H – Website Đăng Ký Phòng Họp
> **Công ty:** Danish Software | **Domain:** @danishsoftware.com

---

## ❓ WHAT – Làm gì?

Xây dựng một **website nội bộ** cho phép nhân viên Danish Software:

- **Đăng nhập** bằng email công ty (`@danishsoftware.com`)
- **Đặt phòng họp** với các mục đích cụ thể: `Review công việc`, `Hỏi đáp`, `Họp kết quả`, v.v.
- **Raise (mời) người tham gia** vào phòng họp
- **Gửi email thông báo tự động** đến những người được mời, **trước 1 tiếng** so với giờ họp

---

## 👤 WHO – Ai liên quan?

| Vai trò | Mô tả |
|---|---|
| **Người đặt phòng (Organizer)** | Nhân viên đăng nhập, chọn phòng, điền thông tin, raise người tham gia |
| **Người được mời (Invitee)** | Nhân viên nhận email thông báo trước 1 tiếng |
| **Admin** | Quản lý danh sách phòng họp, người dùng, lịch sử đặt phòng |
| **Hệ thống email** | Tự động gửi thông báo (có thể dùng SMTP nội bộ hoặc SendGrid) |

---

## ⏰ WHEN – Khi nào?

### Luồng thời gian hoạt động

```
Người dùng đặt phòng
       ↓
Chọn ngày giờ họp (VD: 14:00)
       ↓
Hệ thống lưu lịch + raise danh sách người mời
       ↓
13:00 → Hệ thống tự gửi email nhắc nhở đến toàn bộ invitee
       ↓
14:00 → Cuộc họp diễn ra
```

### Giai đoạn phát triển đề xuất

| Sprint | Nội dung |
|---|---|
| **Sprint 1** | Auth + UI đặt phòng cơ bản |
| **Sprint 2** | Raise người tham gia + gửi email tự động |
| **Sprint 3** | Dashboard admin + quản lý lịch |

---

## 📍 WHERE – Ở đâu?

- **Frontend:** Web app (chạy trên trình duyệt, responsive cho cả desktop & mobile)
- **Backend:** Server nội bộ hoặc cloud (VD: AWS / Azure)
- **Database:** Lưu trữ thông tin phòng họp, lịch đặt, người dùng
- **Email service:** Tích hợp SMTP nội bộ hoặc dịch vụ như SendGrid / Resend
- **Xác thực:** Giới hạn chỉ `@danishsoftware.com` được đăng ký/đăng nhập

---

## ⚙️ HOW – Làm như thế nào?

### 🔐 Xác thực
- Dùng **OAuth2 / Google Workspace SSO** với domain `@danishsoftware.com`, hoặc đăng ký/đăng nhập bằng email + mật khẩu có kiểm tra domain

### 🏢 Đặt phòng
Form đặt phòng gồm các trường:
- Tên cuộc họp
- Mục đích (dropdown): `Review công việc` / `Hỏi đáp` / `Họp kết quả` / ...
- Ngày/giờ bắt đầu – kết thúc
- Phòng họp (chọn từ danh sách có sẵn)

### 👥 Raise người tham gia
- Tìm kiếm nhân viên theo tên/email nội bộ
- Thêm vào danh sách invitee
- Có thể raise nhiều người cùng lúc

### 📧 Email tự động
- Hệ thống chạy **cron job** mỗi phút
- Kiểm tra các cuộc họp sắp diễn ra trong **60 phút**
- Gửi email nhắc nhở với thông tin: phòng, giờ, mục đích, người tổ chức

### 🛠️ Tech Stack gợi ý

| Thành phần | Công nghệ |
|---|---|
| Frontend | React / Next.js |
| Backend | Node.js (Express) hoặc NestJS |
| Database | PostgreSQL |
| Auth | NextAuth / Firebase Auth |
| Email | Nodemailer + SMTP / SendGrid |
| Scheduler | node-cron / BullMQ |

---

*Tài liệu được tạo cho dự án nội bộ Danish Software*
