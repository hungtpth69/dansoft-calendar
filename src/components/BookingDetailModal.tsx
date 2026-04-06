import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, Trash2, Loader2, Info } from 'lucide-react';
import { bookingService, BookingPayload } from '../services/booking.service';
import { User } from 'firebase/auth';

interface Props {
  booking: BookingPayload;
  currentUser: User;
  onClose: () => void;
}

export const BookingDetailModal: React.FC<Props> = ({ booking, currentUser, onClose }) => {
  const [loading, setLoading] = useState(false);
  const isOrganizer = currentUser.uid === booking.organizerUid;

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đặt phòng họp này?")) return;
    setLoading(true);
    try {
      if (booking.id) {
         await bookingService.deleteBooking(booking.id);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xóa lịch họp.");
      setLoading(false);
    }
  };

  const inviteesList = Object.values(booking.invitees || {});

  const renderPurpose = (purpose: string) => {
    switch (purpose) {
      case 'review': return 'Review công việc';
      case 'qa': return 'Hỏi đáp & Giải pháp';
      case 'result': return 'Họp báo cáo kết quả';
      default: return 'Khác';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" /> Chi tiết Cuộc họp
            </h3>
            <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
            {/* Header detail */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">{booking.title}</h2>
              <p className="text-sm font-semibold text-slate-500">Mục đích: <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{renderPurpose(booking.purpose)}</span></p>
            </div>

            <div className="grid gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex items-center gap-3">
                 <CalendarIcon className="w-5 h-5 text-slate-400" />
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase">Ngày diễn ra</p>
                   <p className="text-sm font-semibold text-slate-700">{new Date(booking.startTime).toLocaleDateString('vi-VN')}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-3">
                 <Clock className="w-5 h-5 text-slate-400" />
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase">Khung giờ</p>
                   <p className="text-sm font-semibold text-slate-700">
                     {new Date(booking.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                   </p>
                 </div>
               </div>
               
               <div className="flex items-start gap-3">
                 <Users className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                 <div className="w-full">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-1">Người tham dự ({inviteesList.length + 1})</p>
                   <div className="flex flex-wrap gap-2">
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded border border-indigo-200">
                        {booking.organizerName} (Host)
                      </span>
                      {inviteesList.map((inv: any, idx: number) => (
                        <span key={idx} className="bg-white text-slate-600 text-xs font-semibold px-2 py-1 rounded border border-slate-200 shadow-sm">
                          {inv.name}
                        </span>
                      ))}
                   </div>
                 </div>
               </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
          {/* Nút Xóa dành riêng cho Host */}
          {isOrganizer ? (
             <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1.5 transition-colors">
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
               Hủy Cuộc họp
             </button>
          ) : (
             <div className="text-xs font-medium text-slate-400 italic">Chỉ Host được hủy nhóm</div>
          )}

          <button onClick={onClose} disabled={loading} className="px-5 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-100 text-sm font-semibold">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
