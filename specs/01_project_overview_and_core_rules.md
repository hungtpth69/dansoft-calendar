# SPEC 01: TỔNG QUAN DỰ ÁN & LUẬT LÕI (CORE RULES)

## 1. Mục tiêu (Objective)
Xây dựng một SPA (Single Page Application) Calendar Booking nội bộ giúp mọi nhân viên đặt lịch họp vật lý, họp trực tuyến và quản lý thời gian cá nhân/phòng ban.

## 2. Phân Quyền (Role-based Access)
- **Employee (Nhân viên):** Chỉ quyền CRUD (Create, Read, Update, Delete) trên sự kiện của chính mình. View (chỉ xem) sự kiện của người khác. Thấy lịch trống phòng họp. Nhận cảnh báo (warning) nếu Invitees bị trùng lịch.
- **Manager (Quản lý):** Kế thừa Employee + View Báo cáo, xem chi tiết lịch của team mình.
- **Admin (Hệ thống):** Kế thừa Manager + Quản lý (CRUD) danh mục Phòng họp (Rooms), phân quyền Role cho User dưới database (hoặc Custom Claims).

## 3. Các Biến số Toàn cục (Global Constraints)
1. **Timezone:** Dữ liệu chuẩn lưu là `UTC` Firebase Timestamp. Localize về GMT-based timestamp ở phía Client.
2. **Khóa Quá Khứ (Time-travel Lock):** Mọi sự kiện bắt đầu trước `Date.now()` đều tự động chuyển sang chế độ `Read-Only` ở UI (Không sửa giờ, kéo thả, edit đối với người bình thường).
3. **Overlapping Core:** 
   - *Phòng (Room):* Không bao giờ có 2 sự kiện khác nhau chọn chung 1 phòng vật lý trong một tọa độ thời gian (Giao nhau > 0 phút). **[Hard Block]**.
   - *Nhân sự (User):* Nếu 1 User bị xuất hiện trong 2 events dính chung tọa độ thời gian -> UI hiện Warning `[Bận]` đỏ. Hỏi xác nhận host nếu host bị đụng chính mình. **[Soft Warning]**.

## 4. Tech Stack Quy ước (Boundaries)
- **Framework:** React 18 (Vite JS).
- **Style:** Tailwind CSS + Vanilla CSS (Màu sắc hiện đại).
- **Backend/DB:** Firebase (Auth + Firestore).
- **Lịch UI:** FullCalendar React.
