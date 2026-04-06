import type { Booking } from "../hooks/useBookings";

/**
 * Kiểm tra đụng độ Không gian (Phòng vật lý)
 */
export function checkRoomConflict(
  selectedRoomId: string,
  newStart: Date,
  newEnd: Date,
  allBookings: Booking[],
  excludeBookingId?: string | null
): boolean {
  // Bỏ qua online room (zoom, meet) do không giới hạn không gian vật lý
  if (selectedRoomId === 'zoom' || selectedRoomId === 'meet') return false;

  return allBookings.some((event) => {
    if (excludeBookingId && event.id === excludeBookingId) return false;
    if (event.status !== 'confirmed') return false;
    // Bắt lỗi trùng đúng với room ID đang được chọn
    if (event.roomId !== selectedRoomId) return false;

    const existingStart = event.startTime.toDate().getTime();
    const existingEnd = event.endTime.toDate().getTime();
    
    return (existingStart < newEnd.getTime()) && (existingEnd > newStart.getTime());
  });
}

/**
 * Kiểm tra đụng độ Nhân sự (Trùng lịch User) trên TẤT CẢ các phòng (Online lẫn Offline)
 * Nếu user bị kẹt ở bất kì cuộc họp nào trong khung giờ này -> Báo conflict
 */
export function checkUserConflicts(
  targetUserIds: string[], // [hostId, ...participants]
  newStart: Date,
  newEnd: Date,
  allBookings: Booking[],
  excludeBookingId?: string | null
): string[] {
  const conflictingUsers = new Set<string>();

  const parseMs = (t: any) => {
    if (!t) return Date.now();
    if (typeof t.toDate === 'function') return t.toDate().getTime();
    if (t.seconds) return t.seconds * 1000;
    return new Date(t).getTime();
  };

  allBookings.forEach((event) => {
    if (excludeBookingId && event.id === excludeBookingId) return;
    if (event.status !== 'confirmed') return;

    const existingStart = parseMs(event.startTime);
    const existingEnd = parseMs(event.endTime);

    // Nếu thời gian cuộc họp cắt nhau
    if (existingStart < newEnd.getTime() && existingEnd > newStart.getTime()) {
      const eventUsers = [event.hostId, ...(event.participants || [])];
      
      // Dò xem có ai trong targetUserIds nằm trong danh sách sự kiện này không
      targetUserIds.forEach(uid => {
        if (eventUsers.includes(uid)) {
          conflictingUsers.add(uid);
        }
      });
    }
  });

  return Array.from(conflictingUsers);
}
