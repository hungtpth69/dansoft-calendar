# TÀI LIỆU KỸ THUẬT & KIẾN TRÚC HỆ THỐNG (TECHNOLOGY LOGIC)
**Dự án:** Hệ thống Quản lý Lịch làm việc & Phòng họp nội bộ (Calendar App)
**Phiên bản:** 1.0

---

## 1. TỔNG QUAN KIẾN TRÚC (ARCHITECTURE OVERVIEW)

Hệ thống được phát triển theo mô hình Single Page Application (SPA), serverless backend nhờ Firebase.
- **Frontend Framework:** React 18 với bộ bundler Vite (để xử lý nhanh và tối ưu reload).
- **Styling:** Vanilla CSS hỗ trợ TailwindCSS để tạo UI Dynamic, Glassmorphism và tối ưu hóa thời gian phát triển giao diện.
- **Lịch Giao diện (Calendar Engine):** Tích hợp FullCalendar (React) hoặc React-Big-Calendar. 
- **State Management:** Kết hợp React Context API (cho thông tin Auth/User gốc) và Zustand/Redux Toolkit (cho việc lưu trữ state của data lịch để tránh Rerender).
- **Backend-as-a-Service (BaaS):** Firebase (Authentication: Quản lý token, Cloud Firestore: Database realtime, Firebase Hosting: Triển khai web app).

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (FIRESTORE SCHEMA)

Firestore là CSDL NoSQL, do vậy dữ liệu được tổ chức theo cấu trúc Document-Object-Model nhúng, thiết kế nhằm tránh Over-fetching.

### 2.1 Collection: `users`
Mỗi document ID là Firebase Auth `uid` mặc định cấp.
```json
{
  "uid": "abcxyz123...",
  "email": "employee@dansoft.vn",
  "displayName": "Nguyen Van A",
  "photoURL": "https://...",
  "role": "employee",    // Enum: "employee" | "manager" | "admin"
  "department": "Dev",
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
```

### 2.2 Collection: `rooms`
Chứa thông tin cấu hình phòng họp công ty do Admin setup.
```json
{
  "id": "room_uuid_1",         // Tự tạo UID
  "name": "Phòng Startup",
  "capacity": 15,
  "color": "#ef4444",          // Mã màu hiển thị trên lịch để nhận diện phòng cứng
  "facilities": ["TV", "Bảng"], // Mảng text tĩnh
  "isActive": true             // Admin set false khi phòng bị hỏng chưa sửa
}
```

### 2.3 Collection: `bookings`
Là collection lõi chịu trách nhiệm lưu mọi sự kiện trên hệ thống. Dữ liệu phẳng (Flat data) tối ưu cho câu lệnh range-queries (tìm sự kiện theo tháng).
```json
{
  "id": "booking_id...",
  "title": "Họp Sprint Review",
  "type": "offline",           // Enum: "offline" | "online"
  "roomId": "room_uuid_1",     // (Null nếu type='online')
  "meetLink": "",              // URL string, (Null nếu type='offline')
  "startTime": "timestamp",    // Firebase Timestamp object
  "endTime": "timestamp",      // Firebase Timestamp object
  "hostId": "abcxyz...",       // UID của người tạo
  "participants": [
    "abcxyz...",               // Danh sách UID những người được mời
    "defghi..."
  ],
  "status": "confirmed",       // Enum: "confirmed" | "cancelled"
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 3. FIREBASE SECURITY RULES VÀ INDEXING QUERIES

### 3.1 Góp ý Firestore Security Rules
Khóa bảo mật database ở cấp độ Firebase Console tránh tấn công client thay đổi API payload:
- Collection `users`: Read dành cho mọi user xác thực. Write chỉ cho phép tự update profile bản thân, hoặc Role='admin'.
- Collection `rooms`: Read cho mọi user xác thực. Write, Update, Delete bị deny trừ Role='admin'.
- Collection `bookings`:
  - `create`: Phải có `auth.uid` != null. Trường `hostId` phải bằng chính `request.auth.uid` (Không được lấy UID của người khác để tạo lịch giùm).
  - `update`, `delete`: Chỉ pass nếu `resource.data.hostId == request.auth.uid` hoặc user thực thi là `admin`.

### 3.2 Compounded Indexes (Chỉ mục kết hợp)
Để FullCalendar có thể fetch lịch theo tháng (Range Query) kèm lọc theo phòng họp:
- Cần tạo Index gộp: `roomId` (asc) + `startTime` (asc) + `status` (asc) cho collection `bookings`.
- Khi client load tháng 4, dùng fetch logic: 
  `where("startTime", ">=", startOfMonth) & where("startTime", "<=", endOfMonth)`.

---

## 4. CƠ CHẾ XỬ LÝ CONFLICT (CONFLICT RESOLUTION LOGIC)

Đòi hỏi thiết lập các custom Utils ở Frontend trước khi push dữ liệu vào Firestore để xử lý 2 bài toán lớn:

### 4.1. Check Xung đột Phòng (Room Overlap - Data Block)
Hàm `checkRoomAvailability(roomId, newStart, newEnd)`
1. Frontend Query các sự kiện thuộc `roomId` trong vòng ngày hôm đó.
2. Thuật toán logic: Nếu tồn tại doc thỏa mãn `(existingStart < newEnd) AND (existingEnd > newStart)`, trả về `true` (bị giao nhau). 
3. *Hành động:* Block Save ngay lập tức và ném lỗi Red Toast.

### 4.2. Check Xung đột Nhân sự (User Double-Booking - Data Warning)
Hàm `checkUserAvailability(userIdsArray, newStart, newEnd)`
1. Frontend Query các sự kiện có chứa bất kỳ ID nào trong `userIdsArray` vào ngày đó (Sử dụng Firestore `in` clause hoặc `array-contains-any`).
2. Tương tự, lọc offline client array xem user đó có bị dính `(existingStart < newEnd) AND (existingEnd > newStart)` không.
3. *Hành động:* Không Block Save, mà map array lỗi đó lại thành label `[Bận]` đỏ trên UI list khách mời. Đối với Host, trigger Conform Modal "Bạn đang có lịch bận. Tiếp tục?".

*(Tùy chọn kiến trúc)*: MVP Phase 1 có thể để Client xử lý nhằm tiết kiệm chi phí. Sau đó nên cân nhắc đưa logic chặn ghi (để ngừa race-condition) vào backend bằng Firebase Functions.

---

## 5. THIẾT KẾ CÂY THƯ MỤC SOURCE CODE (FOLDER STRUCTURE)
Quy chuẩn cho mã nguồn Frontend (Vite App):
```text
/src
 ├── assets/                 # Hình ảnh tĩnh, SVG
 ├── components/             # Reusable UI Element (Buttons, Modals, inputs)
     ├── calendar/           # FullCalendar Wrapper component
     ├── form/               # Booking form
 ├── pages/                  # Route level Component (Login, Dashboard, CalendarBoard)
 ├── hooks/                  # Custom Hooks (useAuth, useBookings)
 ├── services/               # Cấu hình API và Firestore queries (firebase.js)
 ├── store/                  # Global state management
 ├── utils/                  # Hàm thuật toán (checkConflict, dateFormat)
 ├── App.jsx                 # Main entry kết hợp React Router
 ├── index.css               # Chứa cài đặt Tailwind base + CSS variables
```
Mỗi UI module nên được phong cách hóa với thiết kế Premium: các Components như Alert, Header... sử dụng các tông màu hiện đại, đổ bóng mềm (drop-shadow) và viền (border/ring) có tỷ lệ độ bo tròn (border-radius) đúng chuẩn UX.
