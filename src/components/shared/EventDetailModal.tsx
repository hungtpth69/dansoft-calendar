import { useCalendarStore } from '../../store/useCalendarStore';
import { useBookings } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useUsers';
import { db } from '../../services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { X, Calendar, MapPin, Link as LinkIcon, User, Trash2, Video } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetailModal() {
  const { isDetailModalOpen, selectedBookingId, closeModal } = useCalendarStore();
  const { bookings } = useBookings();
  const { user } = useAuth();
  const { users } = useUsers();

  if (!isDetailModalOpen || !selectedBookingId) return null;

  const booking = bookings.find(b => b.id === selectedBookingId);
  if (!booking) return null;

  const isHost = user?.uid === booking.hostId;
  const hostUser = users.find(u => u.uid === booking.hostId);
  const participantUsers = users.filter(u => booking.participants?.includes(u.uid));

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy cuộc họp này không? Hành động này không thể hoàn tác.")) return;
    try {
      await deleteDoc(doc(db, 'bookings', selectedBookingId));
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa cuộc họp");
    }
  };

  const parseFbDate = (timeObj: any): Date => {
    if (!timeObj) return new Date();
    if (typeof timeObj.toDate === 'function') return timeObj.toDate();
    if (timeObj.seconds) return new Date(timeObj.seconds * 1000);
    return new Date(timeObj); 
  };

  const start = parseFbDate(booking.startTime);
  const end = parseFbDate(booking.endTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          booking.type === 'online' ? 'bg-indigo-50 border-indigo-100' : 'bg-pink-50 border-pink-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              booking.type === 'online' ? 'bg-indigo-600 text-white shadow-indigo-200/50' : 'bg-pink-600 text-white shadow-pink-200/50'
            } shadow-md`}>
               {booking.type === 'online' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
            </div>
            <h2 className="text-xl font-bold text-slate-800 line-clamp-1 truncate w-64" title={booking.title}>
              {booking.title}
            </h2>
          </div>
          <button onClick={closeModal} className="p-2 hover:bg-white/50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Timeline */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{format(start, 'EEEE, dd MMMM, yyyy')}</p>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
              </p>
            </div>
          </div>

          {/* Location / Link */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổ chức tại</p>
            <div className="flex items-start gap-2">
              {booking.type === 'online' ? (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                  <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline font-medium break-all">
                    {booking.meetLink}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <MapPin className="w-4 h-4 text-pink-500" />
                  {booking.roomId === 'dansoft_lab' ? 'DanSoft Lab (Offline)' : booking.roomId}
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Hosted By */}
          <div className="space-y-3">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người tạo sự kiện</p>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                  {hostUser?.displayName?.charAt(0) || <User className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{hostUser?.displayName || 'Unknown User'}</p>
                  <p className="text-xs text-slate-500">{hostUser?.email}</p>
                </div>
                {isHost && <span className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">Đây là Bạn</span>}
             </div>
          </div>

          {/* Participants */}
          {participantUsers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                Khách mời <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{participantUsers.length}</span>
              </p>
              <div className="space-y-2">
                {participantUsers.map(u => (
                  <div key={u.uid} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {u.displayName?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{u.displayName}</span>
                      <span className="text-xs text-slate-500">{u.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           {isHost ? (
             <div className="flex items-center gap-3">
               <button onClick={handleDelete} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all flex items-center gap-2">
                 <Trash2 className="w-4 h-4" /> Hủy Lịch
               </button>
               <button onClick={() => useCalendarStore.getState().openEditModal(selectedBookingId)} className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-200">
                 Chỉnh Sửa
               </button>
             </div>
           ) : (
             <div></div>
           )}
           <button onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
             Đóng
           </button>
        </div>

      </div>
    </div>
  );
}
