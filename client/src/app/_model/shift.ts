export class Shift {
  id: number = 0;
  userId: number = 0;
  shiftStart: Date = new Date();
  shiftEnd: Date | null = null;
  breakStart: Date | null = null;
  breakEnd: Date | null = null;

  constructor(
    id: number,
    userId: number,
    shiftStart: Date,
    shiftEnd?: Date | null,
    breakStart?: Date | null,
    breakEnd?: Date | null
  ) {
    this.id = id;
    this.userId = userId;
    this.shiftStart = shiftStart;
    this.shiftEnd = shiftEnd || null;
    this.breakStart = breakStart || null;
    this.breakEnd = breakEnd || null;
  }

  // Helper method to calculate total shift duration in hours
  getTotalDuration(): number {
    if (!this.shiftEnd) return 0;

    const duration = this.shiftEnd.getTime() - this.shiftStart.getTime();
    return duration / (1000 * 60 * 60); // Convert milliseconds to hours
  }

  // Helper method to calculate break duration in hours
  getBreakDuration(): number {
    if (!this.breakStart || !this.breakEnd) return 0;

    const duration = this.breakEnd.getTime() - this.breakStart.getTime();
    return duration / (1000 * 60 * 60); // Convert milliseconds to hours
  }

  // Helper method to calculate net working hours (shift duration minus break)
  getNetWorkingHours(): number {
    return this.getTotalDuration() - this.getBreakDuration();
  }

  // Helper method to check if shift is currently active
  isActive(): boolean {
    return !this.shiftEnd;
  }

  // Helper method to check if break is currently active
  isOnBreak(): boolean {
    return !!this.breakStart && !this.breakEnd;
  }

  // Helper method to format dates for display
  static formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
