import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Resend } from 'resend';

// Vercel Serverless API Handler
export default async function handler(req: any, res: any) {
  // Check bảo mật CRON_SECRET của Vercel
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(`[Vercel Cron] Đang chạy tác vụ gửi email tổng hợp ngày lúc ${new Date().toISOString()}`);

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
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Lấy YYYY-MM-DD local (VN)
    const today = new Date();
    // Bù trừ múi giờ Việt Nam (UTC+7)
    const localToday = new Date(today.getTime() + 7 * 60 * 60 * 1000);
    const dateString = localToday.toISOString().split('T')[0];

    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('dateString', '==', dateString));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(200).json({ status: 'ok', message: 'Không có cuộc họp nào trong ngày hôm nay' });
    }

    const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
    
    // Gom nhóm các cuộc họp theo từng email người tham dự
    const userAggr: Record<string, { name: string, meetings: any[] }> = {};

    for (const booking of bookings) {
      const inviteesMap = booking.invitees || {};
      for (const key of Object.keys(inviteesMap)) {
        const invitee = inviteesMap[key];
        
        // Cứ có tham gia là gom nhóm (Chưa gửi bao giờ)
        if (!invitee.isReminderSent) {
           if (!userAggr[invitee.email]) {
              userAggr[invitee.email] = { name: invitee.name, meetings: [] };
           }
           // Đẩy cuộc họp vào mảng của user đó
           userAggr[invitee.email].meetings.push({ bookingId: booking.id, inviteeKey: key, ...booking });
        }
      }
    }

    let mailsSent = 0;
    const documentUpdates = new Set<string>();
    const docUpdatesMap: Record<string, any> = {};

    // Gửi email tổng hợp cho mỗi nhân viên
    for (const email of Object.keys(userAggr)) {
      const user = userAggr[email];
      
      // Sắp xếp lịch họp theo giờ từ sáng đến chiều
      user.meetings.sort((a, b) => a.startTime - b.startTime);

      const htmlMeetingsList = user.meetings.map(m => `
        <li style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
          <strong>${new Date(m.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${new Date(m.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</strong><br/>
          <span style="color: #1e293b; font-size: 16px;">Phòng: ${m.title}</span><br/>
          <span style="color: #64748b; font-size: 14px;">Mục đích: ${m.purpose} | Host: ${m.organizerName}</span>
        </li>
      `).join('');

      try {
        await resend.emails.send({
          from: 'DanSoft Calendar <onboarding@resend.dev>', // Đổi qua email thật sau khi xác minh domain
          to: [email],
          subject: '[Thông Báo] Lịch họp tổng quan ngày hôm nay của bạn',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f172a;">Chào ${user.name},</h2>
              <p>Hôm nay bạn có tổng cộng <strong style="color: #ef4444;">${user.meetings.length}</strong> cuộc họp trên hệ thống DanSoft Calendar.</p>
              <ul style="list-style-type: none; padding-left: 0;">
                ${htmlMeetingsList}
              </ul>
              <p style="margin-top: 25px; font-size: 14px; color: #64748b;">Chúc bạn một ngày làm việc hiệu quả!</p>
            </div>
          `
        });
        
        mailsSent++;
        
        // Đánh dấu là đã gửi thành công cho mỗi booking
        for (const m of user.meetings) {
            documentUpdates.add(m.bookingId);
            if (!docUpdatesMap[m.bookingId]) {
               docUpdatesMap[m.bookingId] = m.invitees; // Lấy dữ liệu nguyên gôc
            }
            // Đánh dấu người này đã nhận
            docUpdatesMap[m.bookingId][m.inviteeKey].isReminderSent = true;
        }

      } catch (err) {
        console.error(`Lỗi gửi mail tổng hợp cho ${email}:`, err);
      }
    }

    // Tiến hành Update Firebase Docs
    for (const bookingId of Array.from(documentUpdates)) {
        await updateDoc(doc(db, 'bookings', bookingId), {
           invitees: docUpdatesMap[bookingId]
        });
    }
    
    return res.status(200).json({ status: 'ok', mailsSent, usersNotified: Object.keys(userAggr).length });
    
  } catch (err: any) {
    console.error("Vercel Cron Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
