# SPEC 03: UX FEATURES & ALGORITHMS (MẶT TRẬN TÍNH TOÁN)

## 1. Flow Đặt lịch Lõi (Core Booking Flow)
1. User click hoặc quét (drag select) một khoảng ngày giờ trên FullCalendar UI.
2. Form Modal bật lên. Mặc định gán Date vào state `startTime` và `endTime`.
3. User chọn Loai Form: `Họp Offline` hoặc `Họp Online`.
   - Nếu `Họp Offline`: Render dropdown chọn Phòng. Call `ROOM_OVERLAP_ALGORITHM` để disable các phòng đã bị book.
   - Nếu `Họp Online`: Render String Input "Điền Link Zoom/Meet".
4. Thêm Thành viên tham gia (Dropdown Multiple Select). Trigger `USER_OVERLAP_ALGORITHM` check realtime -> Render Tag `[Bận]` đỏ kế bên người dùng nếu cần.
5. Cảnh báo (Warning) UI: Sức chứa của phòng (Nếu Offline).
6. Nút "Lưu".

## 2. Algorithms (Thuật toán Kỹ thuật lõi)

### 2.1 Thuật toán Check Xung đột Không gian (Room Overlap)
Chỉ chạy cho `Offline Event`. Trước khi lưu hoặc hiển thị phòng:
```javascript
// Input: roomId, newStart, newEnd
// Output: boolean (có lỗi không)
function checkRoomConflict(roomId, newStart, newEnd, allEvents) {
  return allEvents.some(event => {
    // Chỉ check sự kiện chưa bị hủy
    if (event.status !== 'confirmed') return false;
    // Xét cùng phòng
    if (event.roomId !== roomId) return false;
    // Công thức Intersection
    return (event.startTime < newEnd) && (event.endTime > newStart);
  });
}
```
*Ghi chú UX:* Nếu true, block nút Create, bắn Toast đỏ ngầu.

### 2.2 Thuật toán Check Xung đột Thời gian Nhân sự (User Double-booking)
Chạy khi thay đổi `participants` array hoặc `hostId`.
```javascript
// Input: userIdsArray, newStart, newEnd
// Output: Array các ID user bị trùng lịch
function checkUserConflicts(userIdsArray, newStart, newEnd, allEvents) {
  const conflictingUsers = new Set();
  
  allEvents.forEach(event => {
     if (event.status !== 'confirmed') return;
     // Nếu sự kiện đang xét có giao nhau về thời gian
     if (event.startTime < newEnd && event.endTime > newStart) {
        // Kiểm tra xem có mặt ID user nào thuộc userIdsArray trong DB của event này không
        userIdsArray.forEach(id => {
           if (event.hostId === id || event.participants.includes(id)) {
               conflictingUsers.add(id);
           }
        });
     }
  });
  
  return Array.from(conflictingUsers); // Vd: ['user1_id', 'user3_id']
}
```
*Ghi chú UX:* Filter danh sách này để render chữ `[Bận]` màu đỏ trên form Select hoặc Modal Cảnh báo thay vì chặn khóa luồng (Soft block warning).

## 3. Reschedule Logic (Kéo Thả)
- FullCalendar bắn ra sự kiện `eventDrop` hoặc `eventResize`.
- Lấy `event.id`, `newStart`, `newEnd`.
- Trích xuất `roomId` (nếu có) và danh sách `participants` gọi lại 2 hàm check trên.
- Nếu lọt vào lỗi `Room Overlap` -> Chạy lệnh `info.revert()` trong module của FullCalendar để nhảy UI về lúc chưa kéo thả. Bắn Toast Error.
- Nếu không lọt vào lỗi cơ bản nào (Kể cả bị cảnh báo User bận) -> Cứ gửi Firebase Update query.
