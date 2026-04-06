# SPEC 04: UI/UX & STATE MANAGEMENT ARCHITECTURE

## 1. Cấu trúc Source Code (Vite + React)
Dự án được phân rã theo Domain-Driven Design (phục vụ chức năng Calendar làm trọng tâm).
```text
/src
 ├── assets/                 # SVGs, Logos, Fonts.
 ├── components/             # Reusable UI Element (Buttons, Modals, inputs)
 │   ├── shared/             # (Button, Input, Alert)
 │   ├── calendar/           # Calendar View Components (FullCalendar config)
 │   ├── form/               # Form tạo Booking (Tách nhỏ ra Form Field, Participant Select)
 ├── pages/                  # Route level
 │   ├── Login/
 │   ├── CalendarBoard/      # Trang chúa Calendar
 │   ├── AdminDashboard/     # Quản trị viên quản lý phòng (CRUD room)
 ├── hooks/                  
 │   ├── useAuth.js          # Theo dõi trạng thái Firebase Auth (onAuthStateChanged)
 │   ├── useBookings.js      # Custom hook để fetch, subscribe array sự kiện realtime.
 ├── services/               
 │   ├── firebase.js         # Firebase App Init
 ├── store/                  # Zustand store
 │   ├── useCalendarStore.js # Lưu tạm thời `currentView`, `selectedDate` không cần chọc router.
 ├── utils/                  
 │   ├── conflictEngine.js   # Các hàm tính toán Intersection, Date Math xử lý múi giờ.
 ├── App.jsx                 # react-router-dom provider (Protected Routes)
 ├── index.css               # Tailwind directives và custom FullCalendar classes.
```

## 2. Global State Management (Zustand + React Context)
Vì đặc thù Firebase Firestore API đã cấp sẵn 1 cơ chế `.onSnapshot()` để duy trì Real-Time connection cho dữ liệu `bookings`, hệ thống **KHÔNG CẦN** rập khuôn bỏ toàn bộ list bookings vào Zustand Redux store (tránh state out-of-sync).
- **Zustand Store:** Chỉ ưu tiên quản lý UI State (Ví dụ: `isBookingModalOpen`, `draggedEventInfo`, `activeSideBar`).
- **Context API/ Hook (`useBookings`):** Wrap mảng dữ liệu lấy từ firebase realtime vào một Local State hoặc Context để render trực tiếp vào prop `events={[]}` của FullCalendar.

## 3. UI/UX "Premium" Rules
Theo chỉ đạo thiết kế, tránh các giao diện thuần cơ bản.
1. **Typography & Layout:** Khung lưới thoáng (Padding chuẩn), dùng Font chữ hiện đại (Inter / Roboto). Sidebar quản lý Menu nằm trái, View Lịch nằm full ngang phải.
2. **Glassmorphism / Shadow:** Menu đặt lịch (Modal Form) cần phủ mờ nền (backdrop-blur) và bo góc mềm mại (rounded-2xl) cùng soft shadows (`shadow-lg`).
3. **Màu sắc phòng tĩnh (Static Colors):** Bảng `rooms.color` sẽ chèn động (Dynamic Inject) mã HEX làm `backgroundColor` cho block lịch của FullCalendar giúp tạo sự khác biệt ngay từ cái nhìn đầu tiên. Đối với "Họp Online", lấy chung 1 mã màu Theme Default (Ví dụ Xanh dương Blue-500).
4. **Phản hồi hệ thống (Toast):** Các sự kiện lỗi (Block conflict) phải kích hoạt Toast Red xuất hiện rõ ràng với Icon dấu X. Các sự kiện (Warning) kích hoạt Toast màu Vàng/Cam.
