import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Calendar as CalendarIcon } from 'lucide-react';
import { authService } from '../services/auth.service';
import { User } from 'firebase/auth';
import { BookingModal } from '../components/BookingModal';
import { StatsSidebar } from '../components/StatsSidebar';
import { bookingService, BookingPayload } from '../services/booking.service';

interface Props {
  user: User;
}

export const CalendarPage: React.FC<Props> = ({ user }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date()); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Realtime Database Lịch Đặt Phòng
  const [bookings, setBookings] = useState<BookingPayload[]>([]);

  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const displayMonth = `${monthNames[currentMonth.getMonth()]}, ${currentMonth.getFullYear()}`;

  useEffect(() => {
    // Móc listener live từ Realtime DB ngay khi Bật Dashboard
    const unsub = bookingService.onBookingsChange((data) => {
       setBookings(data);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => authService.logout();

  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  // Viết hàm format Date String khớp với chuẩn YYYY-MM-DD
  const toLocalDateString = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - offset * 60 * 1000);
    return localD.toISOString().split('T')[0];
  }

  const renderTitleUI = (purpose: string) => {
     if (purpose === 'review') return 'bg-purple-100 border-purple-500 text-purple-700';
     if (purpose === 'qa') return 'bg-emerald-100 border-emerald-500 text-emerald-700';
     if (purpose === 'result') return 'bg-orange-100 border-orange-400 text-orange-700';
     return 'bg-blue-100 border-blue-500 text-blue-700';
  }

  const formatTime = (ts: number) => {
     const d = new Date(ts);
     return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`prev-${i}`} className="min-h-[110px] bg-slate-50 opacity-40 border rounded-xl" />);
    
    for (let day = 1; day <= daysInMonth; day++) {
        let dateIter = new Date(year, month, day);
        let normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let isPast = dateIter < normalizedToday;
        let isToday = dateIter.getTime() === normalizedToday.getTime();
        
        let targetDateStr = toLocalDateString(dateIter);
        
        // Nhặt ra các Booking có diễn ra trong ngày đang lặp
        let daysBookings = bookings
            .filter(b => b.dateString === targetDateStr)
            .sort((a,b) => a.startTime - b.startTime);

        days.push(
           <div 
            key={`curr-${day}`} 
            onClick={() => {
              if (!isPast) {
                 setSelectedDate(dateIter);
                 setIsModalOpen(true);
              }
            }}
            className={`min-h-[110px] p-2 border flex flex-col gap-1 transition-all rounded-xl
            ${isPast ? 'bg-slate-50/50 border-slate-200/40 cursor-not-allowed' : 'hover:border-blue-400 cursor-pointer bg-white'}
            ${isToday && !isPast ? 'border-blue-500 bg-blue-50/80 shadow-sm' : ''}
           `}>
             <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : (isPast ? 'text-slate-400/80' : 'text-slate-700')}`}>{day}</span>
             
             {/* RENDER MẢNG BOOKING LIVE TỪ FIREBASE ĐÂY RỒI! */}
             {daysBookings.map((b) => (
               <div key={b.id} className={`text-[10px] font-bold py-1 px-1.5 rounded border-l-2 truncate shadow-sm ${renderTitleUI(b.purpose)} ${isPast ? 'opacity-40' : ''}`}>
                 {formatTime(b.startTime)} - {b.title}
               </div>
             ))}

           </div>
        )
    }
    return days;
  };

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 min-h-screen text-slate-800 flex flex-col gap-6">
      {isModalOpen && (
        <BookingModal user={user} selectedDate={selectedDate} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} />
      )}

      {/* HEADER */}
      <header className="flex justify-between bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-500 p-2 rounded-xl shadow-inner">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">DanSoft</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Hệ thống Đặt phòng họp</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 group p-1 pr-4 rounded-full border border-slate-200 bg-white shadow-sm">
            {user.photoURL ? (
               <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full shadow-md object-cover border border-slate-200" />
            ) : (
               <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-inner">
                 {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
               </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold truncate max-w-[120px]">{user.displayName || 'Nhân viên'}</p>
              <p className="text-xs text-slate-500 truncate max-w-[120px]">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-200">
            <LogOut className="w-5 h-5"/>
          </button>
        </div>
      </header>

      {/* MAIN BODY CHIA 2 CỘT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cột Lịch (3 phần) */}
        <main className="lg:col-span-3 bg-white/60 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 w-[180px]">
                {displayMonth}
              </h2>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-3 text-sm font-medium hover:bg-slate-100 rounded-md text-slate-700 transition-colors">
                  Hôm nay
                </button>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-[13px] font-semibold tracking-wide text-slate-400 hidden sm:block bg-white px-4 py-2 border border-slate-200 rounded-xl">
              Vui lòng chọn một ngày để đặt lịch
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3 mb-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-bold text-slate-400 text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3 flex-1 auto-rows-[minmax(100px,max-content)]">
            {renderDays()}
          </div>
        </main>
        
        {/* Cột Thống kê (1 phần) */}
        <div className="hidden lg:block lg:col-span-1">
          <StatsSidebar />
        </div>
      </div>
    </div>
  );
};
