export type TimeSlot = {
  id: string;
  time: string;
  available: boolean;
  fill?: number;
  status?: 'Open' | 'Busy' | 'Full';
  statusMessage?: string;
};

export const groupedTimeSlots = () => {
  const morning: TimeSlot[] = [
    { id: 'm-8-30', time: '8:30-9:00', available: true },
    { id: 'm-9-01', time: '9:01-9:30', available: true },
    { id: 'm-9-31', time: '9:31-10:00', available: true },
    { id: 'm-10-01', time: '10:01-10:30', available: true },
    { id: 'm-10-30', time: '10:30-11:00', available: true },
    { id: 'm-11-01', time: '11:01-11:30', available: true },
  ];
  
  const afternoon: TimeSlot[] = [
    { id: 'a-11-31', time: '11:31-12:00', available: true },
    { id: 'a-12-01', time: '12:01-12:30', available: true },
    { id: 'a-12-31', time: '12:31-1:00', available: true },
    { id: 'a-1-01', time: '1:01-1:30', available: true },
    { id: 'a-1-31', time: '1:31-2:00', available: true },
    { id: 'a-2-01', time: '2:01-2:30', available: true },
  ];
  
  const evening: TimeSlot[] = [
    { id: 'e-2-31', time: '2:31-3:00', available: true },
    { id: 'e-3-01', time: '3:01-3:30', available: true },
    { id: 'e-3-31', time: '3:31-4:00', available: true },
    { id: 'e-4-01', time: '4:01-4:30', available: true },
    { id: 'e-4-31', time: '4:31-5:00', available: true },
    { id: 'e-5-01', time: '5:01-5:30', available: true },
  ];

  return { morning, afternoon, evening };
};

export default groupedTimeSlots;
