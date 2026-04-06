import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CalendarDays, LogIn, AlertCircle } from 'lucide-react';
import { loginWithCompanyEmail } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Loading Pulse trong khi Firebase kiểm tra Token
  if (loading) return <div className="h-screen w-screen bg-slate-50 flex items-center justify-center animate-pulse" />;
  
  // Điều hướng Board nếu hợp lệ
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async () => {
    setErrorMsg('');
    setIsLoggingIn(true);
    try {
      await loginWithCompanyEmail();
    } catch (error: any) {
      if (error.message === 'ACCESS_DENIED') {
        setErrorMsg('Bạn phải sử dụng email đuôi @danishsoftware.com!');
      } else if (error.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Lỗi đăng nhập: ' + error.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-100 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl bg-white border-white/40 border-0 rounded-3xl mx-4">
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <CalendarDays className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold text-slate-900 tracking-tight">DanSoft Calendar</CardTitle>
          <CardDescription className="text-slate-500 font-medium">Platform Quản lý Môi trường làm việc</CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8 px-8">
          {errorMsg && (
            <div className="mb-6 flex gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{errorMsg}</span>
            </div>
          )}

          <Button 
            onClick={handleLogin} 
            disabled={isLoggingIn}
            className="w-full py-6 text-base font-semibold rounded-xl"
            size="lg"
          >
            {isLoggingIn ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-3" />
                Đăng nhập hệ thống (Google)
              </>
            )}
          </Button>

          <p className="mt-6 text-center text-xs text-slate-400">
            * Hệ thống chỉ chấp nhận email thuộc DanSoft org.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
