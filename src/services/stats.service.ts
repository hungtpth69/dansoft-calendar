import { BookingPayload } from './booking.service';

export interface UserStats {
  id: string;
  name: string;
  email: string;
  avatarLetter: string;
  totalMeetings: number;
  breakdown: { review: number; qa: number; result: number; other: number; };
}

export const statsService = {
  /**
   * Thuật toán bóc tách raw Bookings Firebase thành Bảng vàng Thống Kê
   * Bao gồm cả việc hiển thị những Người Mới chưa có cuộc họp nào (0 Bar)
   */
  calculateMeetingFrequency(bookings: BookingPayload[], allUsers: any[] = []): UserStats[] {
     const statsMap: Record<string, UserStats> = {};
     
     // 1. Phủ sẵn danh sách toàn bộ User trong hệ thống (Default: 0 Cuộc họp)
     allUsers.forEach(u => {
        statsMap[u.email] = {
           id: u.uid,
           name: u.displayName || u.email.split('@')[0],
           email: u.email,
           avatarLetter: (u.displayName || u.email).charAt(0).toUpperCase(),
           totalMeetings: 0,
           breakdown: { review: 0, qa: 0, result: 0, other: 0 }
        };
     });
     
     // 2. Chồng dữ liệu Booking vào để nhồi số
     bookings.forEach(b => {
        // Cộng sổ cho Người tạo
        const orgEmail = b.organizerEmail;
        if (!statsMap[orgEmail]) {
           statsMap[orgEmail] = {
              id: b.organizerUid || orgEmail,
              name: b.organizerName || orgEmail.split('@')[0],
              email: orgEmail,
              avatarLetter: (b.organizerName || orgEmail).charAt(0).toUpperCase(),
              totalMeetings: 0,
              breakdown: { review: 0, qa: 0, result: 0, other: 0 }
           };
        }
        statsMap[orgEmail].totalMeetings += 1;
        
        let p = b.purpose as keyof typeof statsMap[string]['breakdown'];
        if (p !== 'review' && p !== 'qa' && p !== 'result') p = 'other';
        statsMap[orgEmail].breakdown[p] += 1;
        
        // Cộng sổ cho Khách Mời (Invitees) nếu có
        if (b.invitees) {
           Object.values(b.invitees).forEach(inv => {
              if (!statsMap[inv.email]) {
                 statsMap[inv.email] = {
                   id: inv.email,
                   name: inv.name || inv.email.split('@')[0],
                   email: inv.email,
                   avatarLetter: (inv.name || inv.email).charAt(0).toUpperCase(),
                   totalMeetings: 0,
                   breakdown: { review: 0, qa: 0, result: 0, other: 0 }
                 };
              }
              statsMap[inv.email].totalMeetings += 1;
              statsMap[inv.email].breakdown[p] += 1;
           });
        }
     });

     // Trả về mảng đã xếp theo Total
     return Object.values(statsMap).sort((a, b) => b.totalMeetings - a.totalMeetings);
  }
};
