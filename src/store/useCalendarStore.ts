import { create } from 'zustand';

interface CalendarState {
  isBookingModalOpen: boolean;
  isDetailModalOpen: boolean;
  selectedDateRange: { start: Date; end: Date } | null;
  selectedBookingId: string | null;
  
  openBookingModal: (start: Date, end: Date) => void;
  openEditModal: (bookingId: string) => void;
  openDetailModal: (bookingId: string) => void;
  closeModal: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  isBookingModalOpen: false,
  isDetailModalOpen: false,
  selectedDateRange: null,
  selectedBookingId: null,

  openBookingModal: (start, end) => set({ 
    isBookingModalOpen: true, 
    isDetailModalOpen: false,
    selectedDateRange: { start, end },
    selectedBookingId: null 
  }),
  
  openEditModal: (bookingId) => set({
    isBookingModalOpen: true,
    isDetailModalOpen: false,
    selectedBookingId: bookingId,
    selectedDateRange: null
  }),

  openDetailModal: (bookingId) => set({
    isDetailModalOpen: true,
    isBookingModalOpen: false,
    selectedBookingId: bookingId
  }),

  closeModal: () => set({ 
    isBookingModalOpen: false, 
    isDetailModalOpen: false,
    selectedDateRange: null,
    selectedBookingId: null
  }),
}));
