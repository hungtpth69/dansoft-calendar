import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X, Loader2 } from 'lucide-react';
import { bookingService } from '../services/booking.service';
import { authService } from '../services/auth.service';
import { User } from 'firebase/auth';

interface Props {
  user: User;
  selectedDate: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<Props> = ({ user, selectedDate, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('review');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  
  // Nâng cấp: State Fetch Users từ Firebase
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedInvitees, setSelectedInvitees] = useState<any[]>([]);

  useEffect(() => {
     authService.getAllUsers().then(list => {
       // Bỏ bản thân mình ra khỏi list Dropdown
       setAllUsers(list.filter(u => u.uid !== user.uid));
     });
  }, [user.uid]);

  const handleAddUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const email = e.target.value;
     if (!email) return;
     const found = allUsers.find(u => u.email === email);
     if (found && !selectedInvitees.some(i => i.email === email)) {
        setSelectedInvitees([...selectedInvitees, found]);
     }
     e.target.value = ""; // Đưa select về option mặc định
  };

  const handleRemoveUser = (email: string) => {
     setSelectedInvitees(selectedInvitees.filter(i => i.email !== email));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setErrorMsg("Khoan đã! Bạn chưa điền Tiêu đề cuộc họp.");
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Phân tích Time
      const [sH, sM] = startTimeStr.split(':');
      const [eH, eM] = endTimeStr.split(':');
      
      const startD = new Date(selectedDate);
      startD.setHours(parseInt(sH), parseInt(sM), 0, 0);
      
      const endD = new Date(selectedDate);
      endD.setHours(parseInt(eH), parseInt(eM), 0, 0);

      if (startD.getTime() >= endD.getTime()) {
         throw new Error("Logic lỗi: Giờ kết thúc phải lớn hơn giờ bắt đầu.");
      }

      // 2. Chuyển đổi Khách mời hiện đại (Từ Drowdown Chip)
      const inviteesMap: Record<string, any> = {};
      selectedInvitees.forEach(item => {
         const safeKey = item.email.replace(/\./g, '_'); 
         inviteesMap[safeKey] = {
            email: item.email,
            name: item.displayName || item.email.split('@')[0],
            isReminderSent: false
         };
      });

      // 3. Format Date chuẩn YYYY-MM-DD
      const offset = selectedDate.getTimezoneOffset();
      const localS = new Date(selectedDate.getTime() - offset * 60 * 1000);
      const dateString = localS.toISOString().split('T')[0];

      // 4. Gắn Data Base
      await bookingService.createBooking({
        organizerUid: user.uid,
        organizerEmail: user.email || 'unknown',
        organizerName: user.displayName || user.email?.split('@')[0] || 'Member',
        title,
        purpose,
        startTime: startD.getTime(),
        endTime: endD.getTime(),
        dateString,
        invitees: inviteesMap
      });

      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || "Không thể tạo Calendar vào lúc này.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" /> Khởi Tạo Lịch Họp
            </h3>
            <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-6 flex flex-col gap-5">
            <div className="text-sm font-semibold tracking-wide text-blue-700 bg-blue-50 border border-blue-100 p-2.5 rounded-lg text-center uppercase">
              Ngày: {selectedDate.toLocaleDateString('vi-VN')}
            </div>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tiêu Đề & Mục Đích</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Review Giao diện mới..." className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 mb-3 text-sm font-medium" />
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 text-sm font-medium">
                    <option value="review">Review công việc</option>
                    <option value="qa">Hỏi đáp & Bàn giải pháp</option>
                    <option value="result">Họp báo cáo kết quả</option>
                    <option value="other">Họp nội dung khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Khung Thời Gian</label>
                <div className="flex items-center gap-3">
                  <input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-blue-500" />
                  <span className="text-slate-400 font-bold px-2">ĐẾN</span>
                  <input type="time" value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Raise Người Tham Dự</label>
                
                {selectedInvitees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedInvitees.map(u => (
                      <span key={u.email} className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-blue-200">
                        {u.displayName}
                        <button type="button" onClick={() => handleRemoveUser(u.email)} className="hover:text-red-500 bg-blue-200/50 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3 text-blue-800 hover:text-red-600" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <select onChange={handleAddUser} defaultValue="" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-blue-500 text-slate-600 appearance-none bg-slate-50 cursor-pointer">
                   <option value="" disabled>+ Chọn đồng nghiệp từ danh sách nội bộ...</option>
                   {allUsers.map(u => (
                     <option key={u.email} value={u.email}>{u.displayName} ({u.email})</option>
                   ))}
                </select>
              </div>
            </div>

            <div className="min-h-[20px]">
               {errorMsg && <p className="text-red-500 text-xs font-bold">{errorMsg}</p>}
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-200 text-sm font-semibold">Hủy Bỏ</button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 justify-center flex items-center min-w-[150px] rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-70 shadow-lg shadow-blue-500/20">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Chốt Lịch Đặt'}
          </button>
        </div>
      </div>
    </div>
  );
};
