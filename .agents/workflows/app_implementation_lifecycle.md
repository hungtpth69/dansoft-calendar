---
description: Quy trình triển khai ứng dụng Calendar phối hợp qua các role BA, PM và Dev Manager
---

# Danh sách kiểm tra triển khai (Implementation Workflow)

Workflow này là kim chỉ nam để kích hoạt bộ kỹ năng (Skills) của các vai trò cốt lõi. Áp dụng quy trình này để đi từ tài liệu thiết kế đến khi ứng dụng sẵn sàng go-live.

## Phase 1: Initiation & Analysis (BA & PM)
*(Sử dụng Kỹ năng: `role_business_analyst`, `role_project_manager`)*

1. Đọc và tải toàn bộ bối cảnh của bài toán từ file `docs/business_logic.md` để nắm các ràng buộc (Constraints) như Overlapping sự kiện hoặc quá tải phòng họp.
2. Thống nhất và chốt lại bộ Features cho bản Minimal Viable Product (MVP).
3. Đăng nhập Firebase Console, tạo thư mục dự án mới và lấy cấu hình Firebase Config keys.

## Phase 2: Technical Setup & Scaffolding (Dev Manager)
*(Sử dụng Kỹ năng: `role_development_manager`, tham chiếu `docs/technology_logic.md`)*

// turbo
1. Khởi tạo mã nguồn Frontend React + Vite tại thư mục gốc:
```bash
npx -y create-vite@latest ./ --template react
```

// turbo
2. Cài đặt các thư viện thiết yếu (Tailwind, Firebase, State Management, Lịch, Utils):
```bash
npm install firebase react-router-dom zustand @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction date-fns lucide-react
```

// turbo
3. Cài đặt Tailwind CSS và bộ công cụ CSS:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. Áp dụng cấu trúc thư mục (Folder Architecture) chuẩn bằng cách tạo ra các thư mục `src/components`, `src/hooks`, `src/services`, `src/utils` và `src/store`.

## Phase 3: Core Implementation (Dev & Dev Manager)
1. **Setup Firebase Client:** Khởi tạo `src/services/firebase.js` cài cắm các token từ file môi trường (`.local.env`).
2. **Auth Gateway:** Xây dựng màn hình Đăng nhập (Login) và Middleware bảo vệ các routes (Chỉ cho user login mới vào được Calendar).
3. **Phát triển lõi Calendar:** Cài đặt FullCalendar UI components. Render các sự kiện lấy từ Firebase xuống View Tháng/Tuần.
4. **Viết thuật toán Conflict:** Trong thư mục `utils`, xây dựng hàm `hasBookingConflict(roomId, startTime, endTime)` hoạt động theo đúng logic kỹ thuật.
5. **Gắn Firebase Security Rules:** Cập nhật file `.rules` cho Firestore đảm bảo Read/Write chính xác quyền hạn Admin/Manager/Employee.

## Phase 4: Quality Assurance & Launch (PM & BA)
1. Kiểm tra lại các Acceptance Criteria (AC). Test thử trường hợp thêm một sự kiện trùng mã phòng vật lý ở cùng khung giờ xem UI có báo Warning hay Block lại không.
2. Kiểm tra Test nhập Link Meet/Zoom thủ công.
3. Audit Linter (e.g., xoá console logs dư thừa).
4. Run scripts build cho production và deploy (Firebase Hosting / Vercel).
