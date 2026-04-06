import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { authService } from './services/auth.service';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Observer lắng nghe trạng thái auth từ Service layer
    const unsubscribe = authService.onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Điều hướng (Routing) cơ bản dựa trên phiên đăng nhập
  return user ? <CalendarPage user={user} /> : <LoginPage />;
}
