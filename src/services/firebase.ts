import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCxAc-8aNGf7c1_1M26568NAS4OqmYaYQk",
  authDomain: "dansoft-calendar-eb639.firebaseapp.com",
  projectId: "dansoft-calendar-eb639",
  storageBucket: "dansoft-calendar-eb639.firebasestorage.app",
  messagingSenderId: "609904165713",
  appId: "1:609904165713:web:c6f86b073bfd439c2e8970",
  measurementId: "G-D358GDDW4T"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Ép hệ thống chỉ mở Popup Google cho danh sách email thuộc danishsoftware.com
provider.setCustomParameters({
  hd: 'danishsoftware.com'
});

export const loginWithCompanyEmail = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Server/Client chặn lần 2 nếu cố tình lách luật vào bằng email khác
    if (!user.email?.endsWith('@danishsoftware.com')) {
      await signOut(auth); // Kick ra ngay lập tức
      throw new Error("ACCESS_DENIED");
    }

    return user;
  } catch (error) {
    throw error;
  }
};
export const logout = async () => {
  return signOut(auth);
};
