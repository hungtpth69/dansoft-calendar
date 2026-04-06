import React, { useState, useEffect } from 'react';
import { useCalendarStore } from '../../store/useCalendarStore';
import { useBookings } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { checkRoomConflict, checkUserConflicts } from '../../utils/conflictEngine';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { X, Calendar, MapPin, Link as LinkIcon, AlertCircle, Users } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';

export default function BookingModal() {
  const { isBookingModalOpen, selectedDateRange, selectedBookingId, closeModal } = useCalendarStore();
  const { bookings } = useBookings();
  const { users } = useUsers();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [locationType, setLocationType] = useState('dansoft_lab'); // 'dansoft_lab' | 'zoom' | 'meet'
  const [meetLink, setMeetLink] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  
  // Custom Time Inputs enforcing Single-Day logic
  const [meetingDate, setMeetingDate] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorParams, setErrorParams] = useState('');

  // Helper convert sang YYYY-MM-DD
  const toLocalDateStr = (d: Date) => {
    if (!d) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 10);
  };

  // Helper convert sang hh:mm
  const toLocalTimeStr = (d: Date) => {
    if (!d) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().slice(11, 16);
  };

  // Helper convert FB time -> Date
  const parseFbDate = (timeObj: any): Date => {
    if (!timeObj) return new Date();
    if (typeof timeObj.toDate === 'function') return timeObj.toDate();
    if (timeObj.seconds) return new Date(timeObj.seconds * 1000);
    return new Date(timeObj); 
  };

  // Reset cứng Data mỗi khi modal mở lên
  useEffect(() => {
    if (!isBookingModalOpen) return;

    // Chế độ Edit
    if (selectedBookingId) {
      const existing = bookings.find(b => b.id === selectedBookingId);
      if (existing) {
        setTitle(existing.title);
        setLocationType(existing.roomId || 'dansoft_lab');
        setMeetLink(existing.meetLink || '');
        setParticipants(existing.participants || []);
        setErrorParams('');

        const startD = parseFbDate(existing.startTime);
        const endD = parseFbDate(existing.endTime);
        setMeetingDate(toLocalDateStr(startD));
        setStartTimeStr(toLocalTimeStr(startD));
        setEndTimeStr(toLocalTimeStr(endD));
        return;
      }
    }

    // Chế độ Create New
    if (selectedDateRange) {
      setTitle('');
      setLocationType('dansoft_lab');
      setMeetLink('');
      setParticipants([]);
      setErrorParams('');
      
      setMeetingDate(toLocalDateStr(selectedDateRange.start));
      setStartTimeStr(toLocalTimeStr(selectedDateRange.start));
      setEndTimeStr(toLocalTimeStr(selectedDateRange.end));
    }
  }, [isBookingModalOpen, selectedDateRange, selectedBookingId, bookings]);

  if (!isBookingModalOpen) return null;
  if (!selectedDateRange && !selectedBookingId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorParams('');

    try {
      if (!user?.uid) throw new Error("Vui lòng đăng nhập lại!");

      const targetStart = new Date(`${meetingDate}T${startTimeStr}`);
      const targetEnd = new Date(`${meetingDate}T${endTimeStr}`);

      // Kỉ luật số 1: Khoá quá khứ và logic khoảng hở
      if (targetStart < new Date()) {
         throw new Error("Thiết lập lỗi: Không thể tạo cuộc họp trong quá khứ!");
      }
      if (targetEnd <= targetStart) {
         throw new Error("Lỗi nghịch lý: Thời gian kết thúc phải lớn hơn thời gian bắt đầu!");
      }

      // Kỉ luật Same-Day đã được giải quyết triệt để tại cấp UI (Ghép chung 1 biến meetingDate)

      // 1. Phân tích loại sự kiện
      const isOnline = locationType === 'zoom' || locationType === 'meet';
      if (isOnline && !meetLink.trim()) {
        throw new Error('Vui lòng cung cấp Link cuộc họp!');
      }

      // 2. Logic kiểm tra Đụng độ phòng vật lý (Conflict)
      const hasRoomConflict = checkRoomConflict(
        locationType,
        targetStart,
        targetEnd,
        bookings,
        selectedBookingId // Bỏ qua chính nó trong chế độ sửa
      );

      if (hasRoomConflict) {
        throw new Error('Phòng vật lý này đã có người đặt trong thời gian bạn chọn! Vui lòng chọn giờ khác.');
      }

      // 3. Logic kiểm tra Đụng độ nhân sự (User Double-Booking) cho toàn bộ người tham gia
      const assignedUsers = [user.uid, ...participants];
      const busyUsers = checkUserConflicts(
        assignedUsers,
        targetStart,
        targetEnd,
        bookings,
        selectedBookingId // Bỏ qua chính nó trong chế độ sửa
      );

      if (busyUsers.length > 0) {
        throw new Error('Đụng độ thời gian! Bạn hoặc một vài khách mời đã được xếp lịch họp khác trong khung giờ này!');
      }

      // 4. Mapping data sang chuẩn Firestore
      const newBooking = {
        title: title || 'Không có tiêu đề',
        type: isOnline ? 'online' : 'offline',
        roomId: locationType,
        meetLink: isOnline ? meetLink.trim() : null,
        startTime: Timestamp.fromDate(targetStart),
        endTime: Timestamp.fromDate(targetEnd),
        hostId: user.uid,
        participants: participants, 
        status: 'confirmed',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // 5. Bắn lên Server
      if (selectedBookingId) {
        await updateDoc(doc(db, 'bookings', selectedBookingId), {
           ...newBooking,
           createdAt: undefined // Giữ nguyên thời gian tạo cũ nếu updateDoc
        });
      } else {
        await addDoc(collection(db, 'bookings'), newBooking);
      }
      closeModal(); // Thành công -> Tắt Modal
    } catch (err: any) {
      setErrorParams(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-primary w-5 h-5" />
            {selectedBookingId ? 'Cập nhật sự kiện' : 'Lên lịch sự kiện mới'}
          </h2>
          <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Group Input Chỉnh Giờ Cuộc Họp (Native Single-Day UX) */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-1/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Ngày họp
              </label>
              <input 
                type="date" 
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none font-medium text-slate-800 transition-all font-sans"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                Bắt đầu lúc
              </label>
              <input 
                type="time" 
                required
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none font-medium text-slate-800 transition-all font-sans"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                Kết thúc lúc
              </label>
              <input 
                type="time" 
                required
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none font-medium text-slate-800 transition-all font-sans"
              />
            </div>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tên cuộc họp</label>
            <input 
              required
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Họp Sprint Review"
              className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none transition-all"
            />
          </div>

          {/* Chọn địa điểm */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Nơi tổ chức
            </label>
            <select
              value={locationType}
              onChange={e => setLocationType(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none appearance-none"
            >
              <option value="dansoft_lab">🏢 Phòng họp DanSoft Lab (Offline)</option>
              <option value="zoom">📹 Họp trực tuyến qua Zoom</option>
              <option value="meet">📹 Họp trực tuyến qua Google Meet</option>
            </select>
          </div>

          {/* Chọn Khách mời */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> Cập nhật Khách mời (Participants)
            </label>
            <div className="max-h-40 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1">
              {users.filter(u => u.uid !== user?.uid).map((u) => {
                const isSelected = participants.includes(u.uid);
                return (
                  <label key={u.uid} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-100 border border-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 uppercase">
                        {u.displayName?.charAt(0) || u.email?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{u.displayName}</span>
                        <span className="text-xs text-slate-500">{u.email}</span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
                      checked={isSelected}
                      onChange={() => {
                        setParticipants(prev => 
                          prev.includes(u.uid) ? prev.filter(id => id !== u.uid) : [...prev, u.uid]
                        );
                      }}
                    />
                  </label>
                );
              })}
              {users.length <= 1 && (
                <p className="text-xs text-slate-400 p-2 text-center">Chưa có dữ liệu thành viên khác trong hệ thống.</p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">*Hệ thống tự động kiểm tra đụng độ lịch của những người được chọn.</p>
          </div>

          {/* Input Nhập Link (Sẽ ẩn nếu chọn DanSoft Lab) */}
          {(locationType === 'zoom' || locationType === 'meet') && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Link truy cập (URL)
              </label>
              <input 
                required
                type="url"
                value={meetLink}
                onChange={e => setMeetLink(e.target.value)}
                placeholder="Dán link vào đây (https://...)"
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl outline-none text-blue-800 transition-all placeholder:text-blue-300"
              />
            </div>
          )}

          {/* Lỗi cảnh báo */}
          {errorParams && (
            <div className="flex gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl items-start">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{errorParams}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={closeModal}
              className="px-6 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 font-semibold text-white bg-primary hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting ? 'Đang kiểm tra...' : (selectedBookingId ? 'Cập nhật Lịch' : 'Xác nhận Đặt lịch')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
