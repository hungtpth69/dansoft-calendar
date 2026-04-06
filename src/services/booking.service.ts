import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, getDocs, where } from 'firebase/firestore';

export interface Invitee {
  email: string;
  name: string;
  isReminderSent: boolean;
}

export interface BookingPayload {
  id?: string;
  organizerUid: string;
  organizerEmail: string;
  organizerName: string;
  title: string;
  purpose: string;
  startTime: number;
  endTime: number;
  dateString: string;
  invitees: Record<string, Invitee>;
}

export const bookingService = {
  /**
   * Tạo booking mới, kết hợp Query Firestore thông minh để tránh đụng giờ
   */
  async createBooking(payload: BookingPayload) {
    const bookingsRef = collection(db, 'bookings');
    
    // Chỉ cần Query các bản ghi TRONG ĐÚNG NGÀY ĐÓ (Tiết kiệm Read/Băng thông) so với Realtime Database
    const q = query(bookingsRef, where('dateString', '==', payload.dateString));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
       const allBookings = snapshot.docs.map(d => d.data() as BookingPayload);
       const hasConflict = allBookings.some((b) => {
          // Thuật toán kinh điển Check overlap: start1 < end2 && start2 < end1
          return payload.startTime < b.endTime && b.startTime < payload.endTime;
       });
       if (hasConflict) {
          throw new Error("Lỗi OVERLAP: Đã có cuộc họp khác chiếm phòng vào khung giờ này. Vui lòng chọn khoảng thời gian khác!");
       }
    }

    const docRef = await addDoc(bookingsRef, payload);
    return { ...payload, id: docRef.id };
  },

  /**
   * Firestore Realtime Snapshot
   */
  onBookingsChange(
    callback: (bookings: BookingPayload[]) => void,
    onError?: (error: any) => void
  ) {
    const bookingsRef = collection(db, 'bookings');
    return onSnapshot(
      bookingsRef,
      (snapshot) => {
        const parsed = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookingPayload));
        callback(parsed);
      },
      (error) => {
        console.error("Lỗi onSnapshot bookings:", error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Xóa Booking
   */
  async deleteBooking(bookingId: string) {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'bookings', bookingId);
    await deleteDoc(docRef);
  }
};
