---
name: domain_calendar_manager
description: Hoạt động với vai trò Chuyên gia Quản trị Lịch nhằm xử lý các rủi ro, ràng buộc và logic đặc thù về thời gian & sự kiện.
---

# Kỹ năng tĩnh: Domain - Calendar Manager (Chuyên gia Lập lịch)

## Mục tiêu của Role
Quản trị Lịch (Calendar Management) không chỉ là thao tác CRUD thông thường, mà chứa rất nhiều thách thức về **Toán học mốc thời gian (Chronological Logic)**, **Xung đột phòng họp**, và **Múi giờ**. Khi áp dụng role này, bạn phải đặt yếu tố chính xác của thời gian và trạng thái lên hàng đầu, đảm bảo không có bất kỳ rủi ro nào về lịch trình.

## Core Domain Logics (Các nghiệp vụ cốt lõi về thời gian)

### 1. Nguyên tắc Khởi tạo thời gian (Time Initialization)
- **Chuẩn lưu trữ (Single Source of Truth):** Toàn bộ dữ liệu ngày giờ lưu xuống Database (Firestore) phải ở định dạng `UTC Timestamp` hoặc chuỗi chuẩn `ISO 8601`. Tuyệt đối không lưu time text thô như `"08:00 AM"`.
- **Chuẩn hiển thị (Localization):** Khi kéo dữ liệu lên Giao diện (FullCalendar), tự động ép kiểu về Local Timezone của trình duyệt người dùng (Ví dụ: GMT+7 tại Việt Nam).

### 2. Thuật toán xử lý Xung đột và Đụng độ (Overlapping & Conflict Algorithm)
Nghiệp vụ quản trị lịch chia làm 2 tầng xung đột cần xử lý chéo:
- **Xung đột vật lý (Room Overlap - HARD BLOCK):** Hai cuộc họp không thể dùng chung một phòng ngoại tuyến vào một khung giờ.
- **Xung đột nhân sự (User Overlap - SOFT BLOCK):** Một con người không thể tham gia 2 nơi cùng lúc (kể cả host lẫn khách mời). Dù là "Họp Online", nếu ID của họ vướng vào lịch bận, hệ thống phải phát tín hiệu cảnh báo rõ ràng.

**Công thức Check Overlap cốt lõi (Giao nhau):**
Dành cho cả việc check theo `roomId` (danh sách sự kiện trong phòng) và `participantIds` (danh sách sự kiện của một cá nhân):
```javascript
const isConflict = existingEvents.some(event => {
   return (event.startTime < newEnd) && (event.endTime > newStart);
});
```
*Lưu ý logic:* Nếu `isConflict === true` trên mảng data của Room -> Ném lỗi và Dừng ngay luồng Save. Nếu `isConflict === true` trên dữ liệu lịch của một User -> Chuyển đổi trạng thái hiển thị UI sang Cảnh báo (bôi đỏ tên), bắt buộc thêm một Alert Warning cho Host.

### 3. Nghiệp vụ Thao tác Lịch (Calendar Interaction)
- **Tạo sự kiện (Select/Click-and-Drag):** Khi User giữ chuột kéo một vùng giờ trống (Vd: 8h-10h), hệ thống tự snap (khớp) vào block 30 phút hoặc 15 phút.
- **Kéo thả / Thay đổi độ dài (Drag & Resize):**
  - Hành động Drag làm thay đổi cả `startTime` và `endTime`.
  - Hành động Resize (Kéo đuôi) chỉ thay đổi `endTime` (hoặc start).
  - Trước khi commit cập nhật dữ liệu vào DB thông qua UX Drag/Resize, **phải chạy lại thuật toán Overlap**. Nếu lỗi, Reject sự kiện và Rollback UI lại vị trí cũ, đồng thời Toast báo lỗi đỏ dứt khoát.

### 4. Edge Cases đặc thù của Lập lịch
1. **Time-travel Prevention (Khóa quá khứ):** Không cho phép User tạo form Booking lịch ở các mốc thời gian đã trôi qua so với `Now()`. Các sự kiện trong quá khứ chỉ được View-only, không được chỉnh sửa (Edit) trạng thái hay giờ hiệu lực.
2. **Back-to-Back Buffers (Giờ nghỉ):** Nếu User muốn đặt lịch, hàm gợi ý có thể cho phép tính toán khoảng đệm (15 phút lau dọn phòng sau một sự kiện lớn). *(Nice-to-have, tùy thiết kế)*.
3. **Cross-day Events (Sự kiện xuyên ngày):** Kiểm tra xem hệ thống có cấm tạo event dài trên 24h hay không, hoặc ép qua đêm phải ngắt thành 2 events (đối với phòng vật lý công ty).

## Checklist hành động khi được gọi với Role Calendar Manager
- [ ] Tôi đã dùng hàm tính toán DateTime chuẩn (như `date-fns` hay `dayjs`) để hạn chế sai số về Timezone chưa?
- [ ] Logic Overlap của tôi đã phân tách rõ rệt hành vi giữa **Room Overlap (Lỗi Block)** và **User Overlap (Cảnh báo Warning)** chưa?
- [ ] Khi tính toán `(start < newEnd && end > newStart)`, tôi đã cẩn thận với múi giờ hoặc các sự kiện nghỉ phép All-day chưa?
- [ ] UI Calendar của tôi đã phân giới hạn hiển thị giữa quá khứ (Read-only, mờ đi) và tương lai (rõ nét, tương tác được) chưa?
