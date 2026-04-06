import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: 'danishsoftware.com' });

export const authService = {
  /**
   * Đăng nhập chuẩn Enterprise qua Google Workspace
   */
  async loginWithCompany() {
    try {
      const result = await signInWithPopup(auth, provider);
      if (!result.user.email?.endsWith('@danishsoftware.com')) {
        await signOut(auth);
        throw new Error("ACCESS_DENIED");
      }
      
      // Upsert User profile to Firestore Database cho chức năng List Dropdown sau này
      const u = result.user;
      await setDoc(doc(db, 'users', u.uid), {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || u.email?.split('@')[0] || 'Unknown',
        photoURL: u.photoURL || '',
        lastLoginAt: new Date().getTime()
      }, { merge: true });

      return u;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Đăng xuất hệ thống
   */
  async logout() {
    return await signOut(auth);
  },

  /**
   * Theo dõi trạng thái (Observer)
   */
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      if (user && user.email?.endsWith('@danishsoftware.com')) {
        callback(user);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Lấy danh sách toàn bộ Users công ty đã từng vào App
   */
  async getAllUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(doc => doc.data());
  }
};
