import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface Booking {
  id: string;
  title: string;
  type: 'offline' | 'online';
  roomId: string | null;
  meetLink: string | null;
  startTime: Timestamp;
  endTime: Timestamp;
  hostId: string;
  participants: string[];
  status: 'confirmed' | 'cancelled';
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bookings'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Booking[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { bookings, loading };
}
