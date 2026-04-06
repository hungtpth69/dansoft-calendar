# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ (BUSINESS LOGIC)
**Dự án:** Hệ thống Quản lý Lịch làm việc & Phòng họp nội bộ (Calendar App)
**Phiên bản:** 1.0

---

## 1. MỤC TIÊU CỐT LÕI (CORE OBJECTIVES)
Hệ thống cung cấp giải pháp đặt lịch và quản lý thời gian thống nhất cho toàn bộ nhân sự công ty. 
- Giảm thiểu tình trạng trùng lặp (conflict) khi đặt phòng họp vật lý.
- Tích hợp linh hoạt khả năng đặt lịch họp trực tuyến (gắn link tự do cho Zoom, Meet).
- Cung cấp cái nhìn tổng quan về lịch làm việc của cá nhân và phòng ban, giúp cấp quản lý dễ dàng nắm bắt.

---

## 2. CHÂN DUNG NGƯỜI DÙNG (USER PERSONAS) & QUYỀN HẠN

### 2.1. Nhân viên cơ bản (Employee)
- **Nhu cầu:** Xem lịch trống của phòng họp, đặt lịch họp (online hoặc offline), mời đồng nghiệp tham gia, xem lịch cá nhân, thông báo có họp sắp tới.
- **Giới hạn:** Chỉ được quản lý (Edit/Delete) các buổi họp do chính mình tạo ra (Host). Không thể thay đổi các buổi họp của người khác (chỉ xem được chi tiết, hoặc view-only). Không được sửa cấu hình phòng họp.

### 2.2. Quản lý / Trưởng phòng (Manager)
- **Nhu cầu:** Giống nhân viên cơ bản nhưng có thêm nhu cầu báo cáo: xem số liệu họp của các nhân sự trong quyền quản lý, kiểm tra lịch trống của thành viên trong team.

### 2.3. Quản trị viên hệ thống (Admin/HR)
- **Nhu cầu:** Quản trị danh sách phòng họp (Tạo mới, tạm ngưng bảo trì, sửa sức chứa). Theo dõi dashboard về tỷ lệ sử dụng phòng, tần suất họp. Quản lý cấp quyền (role) cho người dùng.

---

## 3. CÁC LUỒNG NGHIỆP VỤ CHÍNH (CORE WORKFLOWS)

### 3.1. Luồng đặt phòng họp (Book Offline Room)
1. User chọn nút "Tạo lịch họp" trên Giao diện Calendar.
2. Form Đặt lịch hiện ra. User điền: Tên cuộc họp, Khung giờ (Start/End), Chọn loại "Họp vật lý".
3. Hệ thống kiểm tra trong Firestore: Từ `Start Time` đến `End Time`, những phòng nào chưa bị đặt -> Đưa ra Dropdown gợi ý các phòng đang trống.
4. User chọn Phòng, thêm "Khách mời" (Người tham gia trong mạng lưới công ty) và Lưu.
5. Cuộc họp nằm gọn trên giao diện Lịch với màu sắc riêng (Ví dụ: Màu đỏ cho phòng A, Màu xanh cho phòng B).

### 3.2. Luồng đặt lịch Online (Online Meeting)
1. Tương tự như trên, nhưng ở bước chọn Loại cuộc họp, User chọn "Online (Zoom/Meet)".
2. Trường giao diện "Chọn phòng" sẽ bị ẩn, thay vào đó là ô nhập Input do User tự Dán (Paste) link Zoom hoặc Google Meet thủ công.
3. User lưu cuộc họp. Sự kiện này được hiển thị lên Lịch cá nhân và Lịch của những người được mời.
4. Không có rủi ro "Trùng phòng" ở luồng này, nhưng vẫn có cảnh báo nếu như host bị trùng lịch với cuộc họp khác.

---

## 4. CHI TIẾT USER STORIES VÀ ACCEPTANCE CRITERIA (AC)

### Tính năng: Form Đặt lịch
**Story 1:** Là một nhân viên, tôi muốn có form nhập giờ bắt đầu và kết thúc để xác nhận thời gian tôi cần họp.
- **AC 1.1:** Mặc định khi ấn vào Calendar ở ngày nào, thì ô StartTime/EndTime lấy giá trị của block thời gian đó (e.g. 10:00 - 11:00).
- **AC 1.2:** Lỗi Validation: Nếu `EndTime` nhỏ hơn hoặc bằng `StartTime` -> Disable nút Save và hiển thị thông báo lỗi mờ "Giờ kết thúc phải sau giờ bắt đầu".
- **AC 1.3:** Không cho phép đặt lịch cho một block thời gian đã qua ở quá khứ.

**Story 2:** Là một nhân viên, tôi muốn chỉ các phòng thực sự "trống" mới hiện lên thanh menu chọn phòng.
- **AC 2.1:** Dropdown danh sách phòng không được render các phòng có Status = "Bảo trì" hoặc đang bị trùng thời gian đặt bởi 1 sự kiện tồn tại. 

**Story 3:** Là người tạo cuộc họp, tôi muốn hủy cuộc họp.
- **AC 3.1:** Khi click vào cuộc họp của mình tạo, có nút "Hủy". Ấn vào hiện Confirm Modal. Xác nhận là Soft Delete ẩn đi khỏi Lịch lớn.

---

## 5. EDGE CASES & BUSINESS VALIDATION RULES
Để hệ thống không gặp vấn đề dữ liệu, mọi tương tác phải tuân thủ:
- **Xung đột phòng họp (Room Overlap - HARD BLOCK):** Tuyệt đối không cho phép 2 sự kiện Offline sử dụng chung một phòng vào cùng một thời điểm. Hệ thống chặn lại hoàn toàn (Block) và không cho lưu.
- **Xung đột nhân sự (User Double-booking - WARNING/SOFT BLOCK):** Một người không thể tham gia 2 cuộc họp khác nhau cùng lúc. 
  - *Host:* Nếu cố đặt lịch đè lên giờ bận của chính mình, hệ thống cảnh báo đỏ "Bạn đã có lịch bận. Vẫn tiếp tục?".
  - *Participants:* Khi chọn người tham gia, ai bị trùng lịch sẽ hiển thị label đỏ `[Bận]` kế bên tên (Soft Check).
- **Trạng thái All-day (Month View Selection) & Single-Day Restriction:** Mọi thao tác click chọn Ngày phải chuẩn hóa thành thời lượng mặc định: **1 Tiếng**. Đặc biệt, **Nghiêm cấm** tạo sự kiện vắt từ ngày này sang ngày hôm sau (Ví dụ qua 12h đêm). Cuộc họp bắt buộc phải bắt đầu và kết thúc gói gọn trong cùng một ngày.
- **Chỉnh sửa lịch (Reschedule):** Khi host kéo-thả sự kiện trên lịch để đổi giờ, tự động trigger kiểm tra toàn bộ Xung đột Phòng và Xung đột Nhân sự. Nếu phòng lỗi -> Rollback kéo thả.
- **Sức chứa của phòng:** Nếu invitees > sức chứa -> Cảnh báo Warning màu vàng, vẫn CÓ THỂ luồn lách cho phép (Flexible).
