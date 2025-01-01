export interface MonthlyStats {
  totalWorkDays: number;
  totalWorkHours: number;
  totalBreakMinutes: number;
  averageShiftLength: number;
  daysWithShifts: string[];  // Array of dates in 'YYYY-MM-DD' format
  dailyStats: {
    date: string;
    hoursWorked: number;
    breakMinutes: number;
    shiftStart: string;
    shiftEnd: string;
  }[];
}
