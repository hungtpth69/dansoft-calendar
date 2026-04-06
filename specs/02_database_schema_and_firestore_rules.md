# SPEC 02: DATABASE SCHEMA & FIRESTORE RULES

## 1. Firestore Data Models
Chủ ý sử dụng thiết kế phẳng (Flat Design) để tương thích với `Range Queries` và tránh phân trang phức tạp trên frontend.

### 1.1. Collection: `users`
**ID Setup:** `auth.uid`
```ts
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'employee' | 'manager' | 'admin';
  department?: string;
  createdAt: firebase.firestore.Timestamp;
}
```

### 1.2. Collection: `rooms`
**ID Setup:** Random Auto Firestore ID
```ts
interface Room {
  id: string;             // Room ID
  name: string;           // Tên phòng (VD: Phòng Apollo)
  capacity: number;       // Sức chứa (VD: 8)
  color: string;          // HEX Code hiển thị trên FullCalendar
  facilities: string[];   // ["TV", "Bảng tương tác"]
  isActive: boolean;      // Trạng thái bảo trì
}
```

### 1.3. Collection: `bookings`
**ID Setup:** Random Auto Firestore ID
```ts
interface Booking {
  id: string;             
  title: string;          
  type: 'offline' | 'online'; 
  roomId: string | null;  // Bắt buộc nếu type=offline
  meetLink: string | null; // (Chuỗi input thủ công) Bắt buộc nếu type=online
  startTime: firebase.firestore.Timestamp; 
  endTime: firebase.firestore.Timestamp;   
  hostId: string;         // Trỏ về `users.uid`
  participants: string[]; // Mảng chứa `uid` của những người tham dự
  status: 'confirmed' | 'cancelled';  
  createdAt: firebase.firestore.Timestamp;
}
```

## 2. Compounded Index Requirements (Chỉ mục Firestore)
Để fetch danh sách `bookings` lên Lịch theo tháng hiệu quả, hệ thống phải tạo mốc Index trên bảng `bookings`:
- `startTime` (Ascending) + `status` (Ascending).
- (Optional): `roomId` (Asc) + `startTime` (Asc) dành cho bộ lọc trang Admin thống kê hiệu suất phòng.

## 3. Security Rules Logic
Áp dụng cấp rules chặt chẽ trên Console/JSON Firebase:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isAdmin() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"; }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow update: if isAuthenticated() && request.auth.uid == userId; // Tự sửa profile
      allow write: if isAdmin();
    }
    match /rooms/{roomId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    match /bookings/{bookingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.hostId == request.auth.uid;
      allow update, delete: if isAuthenticated() && (resource.data.hostId == request.auth.uid || isAdmin());
    }
  }
}
```
