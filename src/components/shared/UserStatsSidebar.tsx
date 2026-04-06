import { useMemo } from 'react';
import { useBookings } from '../../hooks/useBookings';
import { useUsers } from '../../hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function UserStatsSidebar() {
  const { bookings } = useBookings();
  const { users } = useUsers();

  const userStats = useMemo(() => {
    const stats: Record<string, number> = {};
    
    // Đếm số lượng cuộc họp tháng này cho mỗi user
    bookings.forEach(booking => {
      // Tùy theo logic doanh nghiệp, ở đây cộng cho cả host và participants
      if (booking.status !== 'confirmed') return;
      
      const involved = Array.from(new Set([booking.hostId, ...(booking.participants || [])]));
      involved.forEach(uid => {
        if (!uid) return;
        stats[uid] = (stats[uid] || 0) + 1;
      });
    });

    // Match với dữ liệu UserProfile
    const enriched = users.map(user => ({
      ...user,
      meetingCount: stats[user.uid] || 0
    }));

    // Sort giảm dần
    return enriched.sort((a, b) => b.meetingCount - a.meetingCount);
  }, [bookings, users]);

  const maxMeetings = userStats.length > 0 ? Math.max(...userStats.map(u => u.meetingCount), 1) : 1;

  return (
    <Card className="border-0 shadow-lg rounded-3xl bg-white h-full flex flex-col w-80">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg font-bold">Tần Suất Tham Gia</CardTitle>
        </div>
        <p className="text-xs text-slate-500 font-medium">Ai đang họp nhiều nhất hệ thống?</p>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-6 pr-2">
        {userStats.slice(0, 8).map((user, idx) => {
          const ratio = (user.meetingCount / maxMeetings) * 100;
          return (
            <div key={user.uid} className="group relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shadow-sm font-sans uppercase">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      {user.displayName}
                      {idx === 0 && user.meetingCount > 0 && <TrendingUp className="w-3 h-3 text-red-500" />}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate w-32">{user.email}</p>
                  </div>
                </div>
                <div className="bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{user.meetingCount}</span>
                  <span className="text-[10px] text-slate-500 ml-1">Lịch</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-400 to-indigo-500"
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
        {userStats.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">Đang tải biểu đồ...</p>
        )}
      </CardContent>
    </Card>
  );
}
