import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Inbox } from 'lucide-react';
import { bookingService } from '../services/booking.service';
import { authService } from '../services/auth.service';
import { statsService, UserStats } from '../services/stats.service';

export const StatsSidebar: React.FC = () => {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubBookings: any = null;

    // Lắng nghe trạng thái Auth để chắc chắn có User và handle lỗi
    const unsubAuth = authService.onAuthChange((currentUser) => {
      if (!currentUser) return;

      if (unsubBookings) unsubBookings();

      // 1. Lấy toàn bộ Users có sẵn trong DB
      authService.getAllUsers()
        .then(allUsers => {
          let finalUsers = [...allUsers];
          
          // Đảm bảo user hiện tại luôn được tính là 1 user trong danh sách (kể cả chưa họp)
          const exists = finalUsers.some(u => u.email === currentUser.email);
          if (!exists) {
            finalUsers.push({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0],
            });
          }

          // 2. Cắm chốt theo dõi Live Lịch DB
          unsubBookings = bookingService.onBookingsChange(
            (data) => {
              // 3. Phối hợp cả 2 nguồn data ra bản đồ biểu diễn
              const calcs = statsService.calculateMeetingFrequency(data, finalUsers);
              setStats(calcs);
              setLoading(false);
            },
            (error) => {
              console.error("Lỗi onBookingsChange:", error);
              // Lỗi quyền truy cập DB lịch thì vẫn nhả ra danh sách user (kể cả 0 meeting)
              const calcs = statsService.calculateMeetingFrequency([], finalUsers);
              setStats(calcs);
              setLoading(false);
            }
          );
        })
        .catch(err => {
          console.error("Lỗi lấy danh sách user:", err);
          // Fallback phòng trường hợp lỗi Security Rules Firestore
          const fallbackUsers = [{
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
          }];
          unsubBookings = bookingService.onBookingsChange(
            (data) => {
              const calcs = statsService.calculateMeetingFrequency(data, fallbackUsers);
              setStats(calcs);
              setLoading(false);
            },
            (error) => {
              console.error("Lỗi onBookingsChange:", error);
              // Lỗi cả read user lẫn read bookings => vẫn ép nhả 1 user current
              const calcs = statsService.calculateMeetingFrequency([], fallbackUsers);
              setStats(calcs);
              setLoading(false);
            }
          );
        });
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubBookings) unsubBookings();
    };
  }, []);

  // Tính đỉnh scale cho độ dài của Progress Bar
  const maxMeetings = stats.length > 0 ? stats[0].totalMeetings : 1;

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-xl flex flex-col h-full hidden lg:flex">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" /> Tần Suất Tham Gia
          </h3>
          <p className="text-xs text-slate-400 mt-1">Ai đang họp nhiều nhất tháng này?</p>
        </div>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
        {loading ? (
          <div className="text-center text-sm text-slate-400 mt-10">Đang tải biểu đồ...</div>
        ) : stats.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-center text-slate-400 mt-10 gap-2">
              <Inbox className="w-8 h-8 opacity-20" />
              <span className="text-xs">Chưa có dữ liệu.</span>
           </div>
        ) : (
          stats.map((user, idx) => {
            // Toán học phần trăm để chia block cho Progress Bar theo Tỷ Lệ Tuyệt Đối Top 1
            const pReview = (user.breakdown.review / maxMeetings) * 100;
            const pQa = (user.breakdown.qa / maxMeetings) * 100;
            const pResult = (user.breakdown.result / maxMeetings) * 100;

            return (
              <div key={user.id} className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                
                {/* Hàng Info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {user.avatarLetter}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        {user.name} 
                        {idx === 0 && <span title="Bận rộn nhất"><TrendingUp className="w-3.5 h-3.5 text-red-500" /></span>}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate w-32">{user.email}</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                    {user.totalMeetings} <span className="font-normal text-slate-400 text-[10px]">Cuộc họp</span>
                  </div>
                </div>

                {/* Hàng Multi-Progress Bar */}
                <div className="relative pt-1 pb-2">
                  <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden border border-slate-200/50">
                    <div className="h-full bg-purple-500 hover:opacity-80 cursor-help" style={{ width: `${pReview}%` }} title={`Review công việc: ${user.breakdown.review}`} />
                    <div className="h-full bg-emerald-500 hover:opacity-80 cursor-help" style={{ width: `${pQa}%` }} title={`Hỏi đáp: ${user.breakdown.qa}`} />
                    <div className="h-full bg-orange-400 hover:opacity-80 cursor-help" style={{ width: `${pResult}%` }} title={`Họp kết quả: ${user.breakdown.result}`} />
                  </div>
                </div>
                
                {/* Visual Guide (chỉ hiện lúc Hover cho tiết kiệm không gian) */}
                <div className="flex items-center gap-3 text-[9px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500 block"></span> Review</div>
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 block"></span> Q&A</div>
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400 block"></span> Report</div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
