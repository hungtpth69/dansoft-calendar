# Cấu trúc Database chuẩn cho Hệ thống Đặt Phòng (1 Phòng Duy Nhất)

Công ty chỉ có 1 phòng họp duy nhất, vì vậy dữ liệu trong Firebase Realtime Database của bạn sẽ được tối ưu hóa cực kỳ gọn nhẹ không cần bảng `rooms`. Dưới đây là cấu trúc JSON NoSQL:

## 1. Cấu trúc Cây (JSON Tree)
Bạn copy tệp này và Import vào tab Data của bảng console Firebase Realtime.

```json
{
  "users": {
    "admin_uid_xyz": {
      "email": "admin@danishsoftware.com",
      "displayName": "Quản trị viên",
      "role": "admin"
    },
    "emp_uid_abc": {
      "email": "nhanvienA@danishsoftware.com",
      "displayName": "Nhân viên A",
      "role": "employee"
    }
  },

  "bookings": {
    "booking_1712411200000_abc12": {
      "id": "booking_1712411200000_abc12",
      "organizerUid": "emp_uid_abc",
      "organizerEmail": "nhanvienA@danishsoftware.com",
      "title": "Họp Sprint Review Đầu Tuần",
      "purpose": "review", 
      "startTime": 1712411200000, 
      "endTime": 1712414800000,
      "dateString": "2026-04-06",
      "status": "confirmed",
      "invitees": {
        "nhanvienB@danishsoftware.com": {
          "email": "nhanvienB@danishsoftware.com",
          "name": "Nhân viên B",
          "isReminderSent": false
        },
        "sep@danishsoftware.com": {
          "email": "sep@danishsoftware.com",
          "name": "Sếp Giám Đốc",
          "isReminderSent": false
        }
      }
    }
  }
}
```

## 2. Giải thích Thiết kế (Single Room)
- Do chỉ có 1 phòng nên chúng ta KHÔNG CẦN trường khóa ngoại `roomId` hay nguyên cụm Object `rooms` nào nữa.
- Lực lượng cốt lõi bây giờ chỉ xoay quanh `startTime` và `endTime`. Khi User bấm Đặt Lịch, nếu thời gian này "cắt chéo" qua bất kì một Object nào trong bảng `bookings`, lập tức server sẽ chặn và báo "Phòng họp giờ này đã có người đặt". Đơn giản và siêu hiệu quả.
- Việc lưu `invitees` theo dạng Object/Map vẫn được giữ nguyên giúp Cronjob xử lý cờ Email an toàn.

## 3. Cách tổ chức Cronjob (Hệ thống nhắc nhở trước 1h)
Bạn sẽ cần 1 đoạn Node.js Code quét lệnh:
1. Chạy Firebase realtime: Lấy list các `bookings` chạy trong ~60 phút sắp tới.
2. Quét qua `invitees` trong những Booking đó, nếu `isReminderSent == false`, hãy gọi API gửi Mail thông báo *"Bạn SẮP có lịch sử dụng phòng họp"*.
3. Đổi thuộc tính `isReminderSent: true` và đẩy ngược lên DB.
