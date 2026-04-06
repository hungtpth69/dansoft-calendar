import { useState } from 'react';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { authService } from '../services/auth.service';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorStyle, setErrorStyle] = useState('');

  const handleLogin = async () => {
    setErrorStyle('');
    setLoading(true);
    try {
      await authService.loginWithCompany(); 
      // Không cần set logic ở đây, Root Component sẽ lắng nghe onAuthChange
    } catch (e: any) {
      setErrorStyle(e.message === "ACCESS_DENIED" ? "Chỉ nhận email @danishsoftware.com!" : "Lỗi xác thực.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-8 md:p-10 rounded-2xl w-full max-w-[420px] text-center shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg mb-6 shadow-blue-500/20">
          <CalendarIcon className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">DanSoft Booking</h1>
        <p className="text-slate-500 mb-8 font-medium">Đăng ký sử dụng phòng họp nội bộ</p>

        <button onClick={handleLogin} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng nhập bằng Google'}
        </button>
        
        <div className="mt-4 min-h-[24px]">
          {errorStyle && <p className="text-red-500 text-sm font-medium">{errorStyle}</p>}
        </div>
      </div>
    </div>
  );
};
