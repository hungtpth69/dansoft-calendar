import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Resend } from 'resend';

// Vercel Serverless API Handler
export default async function handler(req: any, res: any) {
  // Chỉ cho phép GET request & Check bảo mật CRON_SECRET của Vercel (chặn người ngoài gọi bậy)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(`[Vercel Cron] Đang chạy tác vụ gửi email lúc ${new Date().toISOString()}`);

  // Cấu hình Firebase
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCxAc-8aNGf7c1_1M26568NAS4OqmYaYQk",
    authDomain: "dansoft-calendar-eb639.firebaseapp.com",
    projectId: "dansoft-calendar-eb639",
    storageBucket: "dansoft-calendar-eb639.firebasestorage.app",
    messagingSenderId: "609904165713",
    appId: "1:609904165713:web:c6f86b073bfd439c2e8970",
    measurementId: "G-D358GDDW4T"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Vercel sẽ tự load biến môi trường RESEND_API_KEY từ Dashboard
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const now = Date.now();
    const oneHourLater = now + 60 * 60 * 1000;
    
    // Lấy YYYY-MM-DD local
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    const dateString = localToday.toISOString().split('T')[0];

    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('dateString', '==', dateString));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(200).json({ status: 'ok', message: 'Không có cuộc họp nào trong ngày' });
    }

    const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
    let mailsSent = 0;

    for (const booking of bookings) {
      // Họp từ NGAY BÂY GIỜ đến 1 TIẾNG NỮA
      if (booking.startTime > now && booking.startTime <= oneHourLater) {
        let needsUpdate = false;
        const updatedInvitees = { ...booking.invitees };

        for (const key of Object.keys(updatedInvitees)) {
          const invitee = updatedInvitees[key];
          
          if (!invitee.isReminderSent) {
            try {
              await resend.emails.send({
                from: 'DanSoft Calendar <onboarding@resend.dev>', // Đổi qua domain cty sau khi xác thực vs Resend
                to: [invitee.email],
                subject: `[Nhắc Khéo] Cuộc họp "${booking.title}" sẽ bắt đầu trong khoảng 1 tiếng nữa`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                    <h2>Chào ${invitee.name},</h2>
                    <p>Hệ thống nhắc nhở tự động từ <strong>DanSoft Calendar</strong>.</p>
                    <p>Cuộc họp <strong>${booking.title}</strong> do ông/bà <strong>${booking.organizerName}</strong> tổ chức sắp diễn ra.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                      <tr><td style="padding: 5px 0;"><strong>Mục đích:</strong></td><td style="padding: 5px 0;">${booking.purpose}</td></tr>
                      <tr><td style="padding: 5px 0;"><strong>Thời gian:</strong></td><td style="padding: 5px 0;">${new Date(booking.startTime).toLocaleTimeString('vi-VN')} - ${new Date(booking.endTime).toLocaleTimeString('vi-VN')}</td></tr>
                      <tr><td style="padding: 5px 0;"><strong>Ngày:</strong></td><td style="padding: 5px 0;">${new Date(booking.startTime).toLocaleDateString('vi-VN')}</td></tr>
                    </table>
                    <p style="margin-top: 20px; font-weight: bold; color: #d32f2f;">Vui lòng chuẩn bị sẵn sàng trước khi cuộc họp bắt đầu nhé!</p>
                  </div>
                `
              });
              
              updatedInvitees[key].isReminderSent = true;
              needsUpdate = true;
              mailsSent++;
            } catch (emailError) {
              console.error(`Lỗi gửi mail: ${invitee.email}`, emailError);
            }
          }
        }

        if (needsUpdate) {
          await updateDoc(doc(db, 'bookings', booking.id), {
            invitees: updatedInvitees
          });
        }
      }
    }
    
    return res.status(200).json({ status: 'ok', mailsSent });
    
  } catch (err: any) {
    console.error("Vercel Cron Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
