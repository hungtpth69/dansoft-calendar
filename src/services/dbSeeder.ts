import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Mô phỏng 2 phòng họp chuẩn để đưa lên database ban đầu
const initialRooms = [
  {
    id: "DA_NANG_ROOM_A",
    name: "Phòng Họp DanSoft Lớn",
    capacity: 12,
    color: "#EF4444", // Đỏ chuẩn Tailwind Red-500
    facilities: ["Smart TV", "Bảng Trắng", "Máy Lạnh"],
    isActive: true
  },
  {
    id: "DA_NANG_ROOM_B",
    name: "Phòng Họp B (Interview)",
    capacity: 4,
    color: "#3B82F6", // Xanh Blue-500
    facilities: ["Bảng Trắng"],
    isActive: true
  }
];

export const seedDatabaseRooms = async () => {
  try {
    const roomsCol = collection(db, "rooms");
    const snapshot = await getDocs(roomsCol);
    
    // Chỉ seed nếu DB đang trắng (chưa có phòng nào)
    if (snapshot.empty) {
      console.log("No rooms found, migrating base data...");
      
      for (const room of initialRooms) {
        // Build document với Hardcoded ID cho chuẩn hóa dễ query
        const roomRef = doc(db, "rooms", room.id);
        await setDoc(roomRef, room);
        console.log(`Pushed room: ${room.name}`);
      }
      
      return "SUCCESS: Rooms injected into Firestore.";
    }
    
    return "SKIPPED: Rooms data already exists.";
  } catch (error) {
    console.error("Seed error: ", error);
    throw error;
  }
};
