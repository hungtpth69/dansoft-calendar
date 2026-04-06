# Danish Software - Calendar & Meeting Room Booking System

Dự án này là hệ thống lịch và đặt phòng họp nội bộ dành riêng cho **Danish Software**, có tích hợp dashboard quản lý thống kê người dùng theo thời gian thực.

## 5W1H Framework của Dự án

### 1. Who (Hệ thống dành cho ai?)

- **Người dùng cuối (End-users):** Toàn bộ nhân viên nội bộ của công ty Danish Software.
- **Người quản trị (Admins):** Bộ phận Hành chính/Nhân sự (HR/Admin) dùng để theo dõi không gian, quản lý danh sách phòng họp và xem thống kê nhân sự và tiến độ công việc.

### 2. What (Dự án này là gì?)

- Đây là **Hệ thống đặt phòng họp nội bộ** (Internal Meeting Room Booking System) kết hợp xem lịch.
- Hệ thống giải quyết việc quản lý các khung thời gian đặt phòng, tránh xung đột lịch. Hơn nữa, nó đi kèm với một **Dashboard thống kê thời gian thực** (Real-time Dashboard) để theo dõi hoạt động booking của tất cả thành viên trong công ty.

### 3. Where (Dự án hoạt động ở đâu?)

- **Nền tảng:** Là ứng dụng Web (Web Application), truy cập đa nền tảng qua trình duyệt.
- **Lưu trữ dữ liệu:** Lưu trữ hạ tầng đám mây trên **Firebase Cloud Firestore**, thay thế cho Realtime Database nhằm mang lại sự linh hoạt và tính nhất quán cao hơn cho cấu trúc dữ liệu.

### 4. When (Khi nào sử dụng hệ thống?)

- **Đặt lịch:** Bất kỳ khi nào nhân viên hoặc các nhóm nội bộ có nhu cầu họp bàn công việc, tiếp khách hoặc tổ chức sự kiện tại công ty.
- **Thống kê / Kiểm soát:** Dashboard hoạt động thời gian thực (Real-time) ngay khi có thao tác trên hệ thống để người quản trị hoặc quản lý có thể cập nhật trạng thái mọi lúc.

### 5. Why (Tại sao lại cần hệ thống này?)

- **Giải quyết nỗi đau (Pain-point):** Giúp loại bỏ hoàn toàn việc đặt trùng phòng họp, tổ chức lịch biểu chuyên nghiệp và trực quan hơn.
- **Về mặt kỹ thuật:** Việc di chuyển từ Firebase Realtime Database sang Cloud Firestore (Migration) cung cấp một hạ tầng dữ liệu tối ưu, mạnh mẽ và dễ bảo trì định tuyến hơn.
- Tối ưu hóa trải nghiệm điền form với tính năng Select Dropdown thông minh (chọn trực tiếp người tham gia nội bộ thay vì phải nhập văn bản).

### 6. How (Dự án được xây dựng và hoạt động như thế nào?)

- **Công nghệ Frontend:**
  - Sử dụng **React 18** và công cụ build **Vite** mang lại hiệu suất tối ưu.
  - Giao diện được thiết kế với **Tailwind CSS**.
  - Icon system sử dụng thư viện **Lucide React**.
- **Công nghệ Backend / Database:** Quản lý dữ liệu thông qua **Firebase (Cloud Firestore)**.
- **Luồng hoạt động:** Nhân viên được phân quyền đăng nhập -> Chọn khung giờ trống từ Lịch -> Sử dụng form đặt có dropdown thông minh để thêm người nội bộ tham gia -> Xác nhận đặt phòng -> Dữ liệu cập nhật lên Firestore và đổ ngay lập tức về Real-time Dashboard thống kê.

---

## 💻 Tech Stack & Getting Started (Dành cho Lập trình viên)

### Công nghệ sử dụng

- **Core:** [React JS](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **BaaS (Backend as a Service):** [Firebase / Cloud Firestore](https://firebase.google.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Các lệnh cơ bản

1. **Cài đặt thư viện:**

   ```bash
   npm install
   ```

2. **Chạy server phát triển (Development):**

   ```bash
   npm run dev
   ```

   *Mở trình duyệt ở `http://localhost:5173` để xem ứng dụng.*

3. **Build dự án cho Production:**

   ```bash
   npm run build
   ```

4. **Chạy xem trước bản Build (Preview):**

   ```bash
   npm run preview
   ```

5. **Linting (Kiểm tra lỗi mã nguồn):**

   ```bash
   npm run lint
   ```
