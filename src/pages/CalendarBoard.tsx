import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { LogOut, Calendar as CalIcon, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/firebase';
import { useBookings } from '../hooks/useBookings';
import { useCalendarStore } from '../store/useCalendarStore';
import BookingModal from '../components/form/BookingModal';
import EventDetailModal from '../components/shared/EventDetailModal';
import UserStatsSidebar from '../components/shared/UserStatsSidebar';

export default function CalendarBoard() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { openBookingModal, openDetailModal } = useCalendarStore();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'rooms'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Chuyển đổi dữ liệu cho FullCalendar
  const parseFbDate = (timeObj: any): Date => {
    if (!timeObj) return new Date();
    if (typeof timeObj.toDate === 'function') return timeObj.toDate();
    if (timeObj.seconds) return new Date(timeObj.seconds * 1000);
    return new Date(timeObj); 
  };

  const calendarEvents = bookings.map(b => ({
    id: b.id,
    title: b.title,
    start: parseFbDate(b.startTime),
    end: parseFbDate(b.endTime),
    classNames: b.type === 'online' ? ['event-online'] : ['event-offline'],
    extendedProps: { hostId: b.hostId, type: b.type }
  }));

  const handleDateSelect = (selectInfo: any) => {
    let targetStart = selectInfo.start;
    let targetEnd = selectInfo.end;

    // Chuẩn hoá Data: Nếu user click vào nguyên ngày (DayGridMonth)
    // FullCalendar sẽ trả về Midnight ngày A đến Midnight ngày B (24 tiếng).
    // Phải override thành mặc định 1 Tiếng vì logic booking cuộc họp
    if (selectInfo.allDay) {
      const now = new Date();
      targetStart = new Date(selectInfo.start);
      
      // Mặc định tạo cuộc họp lúc 09:00 Sáng. Nếu chọn hôm nay -> Lùi về giờ tiếp theo (Ví dụ 10h -> 11h)
      if (targetStart.toDateString() === now.toDateString()) {
        targetStart.setHours(now.getHours() + 1, 0, 0, 0);
      } else {
        targetStart.setHours(9, 0, 0, 0);
      }
      
      // End luôn bằng Start + 1 tiếng
      targetEnd = new Date(targetStart.getTime() + 60 * 60 * 1000);
    }

    // 1. Chặt đứt ngay từ nguồn: Không cho rải lịch vào quá khứ (Time-travel lock)
    if (targetStart < new Date()) {
      alert("❌ Hành động bị Từ Chối: Bạn không thể đặt lịch họp ở một mốc thời gian trong quá khứ!");
      selectInfo.view.calendar.unselect();
      return;
    }
    
    openBookingModal(targetStart, targetEnd);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: any) => {
    openDetailModal(clickInfo.event.id);
  };

  // Custom Navigation Buttons
  const handlePrev = () => {
    const api = calendarRef.current?.getApi();
    api?.prev();
    if (api) setCurrentDate(api.getDate());
  };
  
  const handleNext = () => {
    const api = calendarRef.current?.getApi();
    api?.next();
    if (api) setCurrentDate(api.getDate());
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    api?.today();
    if (api) setCurrentDate(api.getDate());
  };

  const handleDatesSet = (dateInfo: any) => {
    // Only update if it's vastly different to prevent infinite re-renders or flickering
    setCurrentDate(dateInfo.view.currentStart);
  };

  const currentMonthBookings = bookings.filter(b => {
    const d = parseFbDate(b.startTime);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  return (
    <div className="h-screen flex flex-col bg-[#F4F7FB] overflow-hidden p-4 gap-4">
      
      {/* Top Header */}
      <header className="bg-white rounded-2xl shadow-sm px-6 py-3 flex items-center justify-between border border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-200">
            <CalIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">DanSoft</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hệ thống đặt phòng</p>
          </div>
        </div>

        {/* Tab Switcher (Dashboard vs Room) */}
        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lịch Đặt Phòng
          </button>
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'rooms' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Danh Sách Phòng
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block pr-2">
              <p className="text-sm font-bold text-slate-700 leading-tight">{user?.displayName}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Lõi Center Content */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          {activeTab === 'calendar' ? (
            <div className="p-6 flex flex-col h-full">
              {/* Custom Calendar Header mô phỏng Shadcn UI */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tight">
                  {format(currentDate, 'MMMM, yyyy')}
                </h2>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-1">
                    <button onClick={handlePrev} className="p-1 px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleToday} className="px-4 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      Hôm nay
                    </button>
                    <button onClick={handleNext} className="p-1 px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    className="ml-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    onClick={() => openBookingModal(new Date(), new Date(Date.now() + 3600000))}
                  >
                    + Tạo sự kiện
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                 <FullCalendar
                   ref={calendarRef}
                   plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                   initialView="dayGridMonth"
                   selectable={true}
                   editable={false}
                   events={calendarEvents}
                   select={handleDateSelect}
                   eventClick={handleEventClick}
                   datesSet={handleDatesSet}
                   height="100%"
                   dayMaxEvents={3}
                 />
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col h-full overflow-hidden bg-[#F4F7FB]/50">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                     <LayoutGrid className="w-6 h-6 text-primary" /> Phân Bổ Phòng Theo Tháng
                  </h2>
                  <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-xl border border-primary/20">
                     {format(currentDate, 'MMMM, yyyy')}
                  </span>
               </div>
               
               <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                 
                 {/* Cột 1: DanSoft Lab */}
                 <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-pink-50/50 flex flex-col items-center justify-center">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> DanSoft Lab
                       </h3>
                       <p className="text-xs text-slate-400 font-medium">Họp trực tiếp (Offline)</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                       {currentMonthBookings.filter(b => b.roomId === 'dansoft_lab').sort((a,b) => parseFbDate(a.startTime).getTime() - parseFbDate(b.startTime).getTime()).map(b => (
                         <div key={b.id} onClick={() => openDetailModal(b.id)} className="bg-white border text-left border-slate-100 border-l-4 border-l-pink-400 p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all">
                            <p className="font-bold text-slate-800 mb-2 truncate" title={b.title}>{b.title}</p>
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                              <span className="bg-slate-100 px-2 py-1 rounded-md">{format(parseFbDate(b.startTime), 'dd/MM')}</span>
                              <span>{format(parseFbDate(b.startTime), 'HH:mm')} - {format(parseFbDate(b.endTime), 'HH:mm')}</span>
                            </div>
                         </div>
                       ))}
                       {currentMonthBookings.filter(b => b.roomId === 'dansoft_lab').length === 0 && (
                         <p className="text-sm text-center text-slate-400 py-6 italic">Trống (Chưa có lịch phân bổ)</p>
                       )}
                    </div>
                 </div>
            
                 {/* Cột 2: Zoom */}
                 <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-indigo-50/50 flex flex-col items-center justify-center">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Zoom Meeting
                       </h3>
                       <p className="text-xs text-slate-400 font-medium">Trực tuyến</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                       {currentMonthBookings.filter(b => b.roomId === 'zoom').sort((a,b) => parseFbDate(a.startTime).getTime() - parseFbDate(b.startTime).getTime()).map(b => (
                         <div key={b.id} onClick={() => openDetailModal(b.id)} className="bg-white border text-left border-slate-100 border-l-4 border-l-indigo-400 p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all">
                            <p className="font-bold text-slate-800 mb-2 truncate" title={b.title}>{b.title}</p>
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                              <span className="bg-slate-100 px-2 py-1 rounded-md">{format(parseFbDate(b.startTime), 'dd/MM')}</span>
                              <span>{format(parseFbDate(b.startTime), 'HH:mm')} - {format(parseFbDate(b.endTime), 'HH:mm')}</span>
                            </div>
                         </div>
                       ))}
                       {currentMonthBookings.filter(b => b.roomId === 'zoom').length === 0 && (
                         <p className="text-sm text-center text-slate-400 py-6 italic">Trống (Chưa có lịch phân bổ)</p>
                       )}
                    </div>
                 </div>
            
                 {/* Cột 3: Meet */}
                 <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex flex-col items-center justify-center">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Google Meet
                       </h3>
                       <p className="text-xs text-slate-400 font-medium">Trực tuyến</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                       {currentMonthBookings.filter(b => b.roomId === 'meet').sort((a,b) => parseFbDate(a.startTime).getTime() - parseFbDate(b.startTime).getTime()).map(b => (
                         <div key={b.id} onClick={() => openDetailModal(b.id)} className="bg-white border text-left border-slate-100 border-l-4 border-l-emerald-400 p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all">
                            <p className="font-bold text-slate-800 mb-2 truncate" title={b.title}>{b.title}</p>
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                              <span className="bg-slate-100 px-2 py-1 rounded-md">{format(parseFbDate(b.startTime), 'dd/MM')}</span>
                              <span>{format(parseFbDate(b.startTime), 'HH:mm')} - {format(parseFbDate(b.endTime), 'HH:mm')}</span>
                            </div>
                         </div>
                       ))}
                       {currentMonthBookings.filter(b => b.roomId === 'meet').length === 0 && (
                         <p className="text-sm text-center text-slate-400 py-6 italic">Trống (Chưa có lịch phân bổ)</p>
                       )}
                    </div>
                 </div>
            
               </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Participation Stats */}
        <div className="w-80 shrink-0">
          <UserStatsSidebar />
        </div>
      </div>
      
      {/* Modals Overlay */}
      <BookingModal />
      <EventDetailModal />
    </div>
  );
}
