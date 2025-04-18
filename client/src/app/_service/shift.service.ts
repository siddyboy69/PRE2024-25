import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Shift } from '../_model/shift';
import { MessageService } from './message.service';
import { MonthlyStats } from '../_model/monthly-stats';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private apiUrl = 'http://localhost:3000';  // Base URL matching your backend

  constructor(
    private http: HttpClient,
    private msg: MessageService
  ) {}

  /**
   * Helper: Parse a "YYYY-MM-DD HH:mm:ss" string as local time.
   * If you want to skip any offset shifting, this ensures 2024-11-01 10:00:00
   * is treated as local Nov 1st at 10 AM.
   */
  private parseLocalDateTime(dateTimeStr: string | null): Date | null {
    if (!dateTimeStr) {
      return null;
    }
    // Expect format: "YYYY-MM-DD HH:mm:ss"
    const [datePart, timePart] = dateTimeStr.split(' ');
    if (!datePart || !timePart) {
      return null;
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    // Create a Date in local time:
    return new Date(year, month - 1, day, hour, minute, second);
  }

  /** Helper to generate Authorization headers */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  /** Helper for error handling */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.msg.addMessage(`${operation} fehlgeschlagen`);
      return of(result as T);
    };
  }

  /**
   * GET shifts for a specific user
   * The backend returns shift objects with string date/time fields.
   * We parse them with parseLocalDateTime to avoid time-zone shifts.
   */
  getUserShifts(userId: number): Observable<Shift[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/shifts/user/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shifts => console.log('Fetched shifts:', shifts)),
        map(rawShifts =>
          rawShifts.map(shift => {
            return new Shift(
              shift.id,
              shift.user_id,
              this.parseLocalDateTime(shift.shiftStart) || new Date(),
              shift.shiftEnd ? this.parseLocalDateTime(shift.shiftEnd) : null,
              shift.breakStart ? this.parseLocalDateTime(shift.breakStart) : null,
              shift.breakEnd ? this.parseLocalDateTime(shift.breakEnd) : null
            );
          })
        ),
        catchError(this.handleError<Shift[]>('getUserShifts', []))
      );
  }

  /** GET all shifts (admin only) */
  getAllShifts(): Observable<Shift[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/shifts/all`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shifts => console.log('Fetched all shifts:', shifts)),
        map(rawShifts =>
          rawShifts.map(shift => {
            return new Shift(
              shift.id,
              shift.user_id,
              this.parseLocalDateTime(shift.shiftStart) || new Date(),
              shift.shiftEnd ? this.parseLocalDateTime(shift.shiftEnd) : null,
              shift.breakStart ? this.parseLocalDateTime(shift.breakStart) : null,
              shift.breakEnd ? this.parseLocalDateTime(shift.breakEnd) : null
            );
          })
        ),
        catchError(this.handleError<Shift[]>('getAllShifts', []))
      );
  }

  /** Start a shift for a specific user */
  startShift(userId: number): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/shifts`, { userId }, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => console.log('ShiftService start response:', response)),
        catchError(this.handleError<any>('startShift'))
      );
  }

  /** End a shift for a specific user (puts shiftEnd = now) */
  endShift(userId: number): Observable<any> {
    const now = new Date().toISOString(); // If you want to store UTC or local, depends on the backend
    return this.http
      .put(`${this.apiUrl}/shifts/end/${userId}`, { shiftEnd: now }, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => console.log('Shift ended:', response)),
        catchError(this.handleError<any>('endShift'))
      );
  }

  /** Delete a shift by shiftId */
  deleteShift(shiftId: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/shifts/${shiftId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.msg.addMessage('Schicht gelöscht')),
        catchError(this.handleError<any>('deleteShift'))
      );
  }

  /** Get the current active shift for a user (no shiftEnd set) */
  getCurrentShift(userId: number): Observable<Shift | null> {
    return this.getUserShifts(userId).pipe(
      map(shifts => shifts.find(shift => !shift.shiftEnd) || null),
      catchError(this.handleError<Shift | null>('getCurrentShift', null))
    );
  }

  /** Check if a user is currently on break (true if breakStart != null and breakEnd == null) */
  isUserOnBreak(userId: number): Observable<boolean> {
    return this.getCurrentShift(userId).pipe(
      map(shift => (shift ? shift.isOnBreak() : false)),
      catchError(this.handleError<boolean>('isUserOnBreak', false))
    );
  }

  /** Get the active shift from the backend route /shifts/active/:userId */
  getActiveShift(userId: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/shifts/active/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shift => console.log('Active shift:', shift)),
        catchError(this.handleError<any>('getActiveShift', null))
      );
  }

  /** For "Today’s shift" — returns the shift with breaks for the given day */
  getTodayShift(userId: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/shifts/today/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shift => console.log('Today shift:', shift)),
        catchError(this.handleError<any>('getTodayShift', null))
      );
  }

  /** Start a break for the currently active shift */
  startBreak(userId: number): Observable<any> {
    const now = new Date().toISOString();
    return this.http
      .post(`${this.apiUrl}/shifts/break/start/${userId}`, { breakStart: now }, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => console.log('Break started')),
        catchError(this.handleError<any>('startBreak'))
      );
  }

  /** End the current break for the user */
  endBreak(userId: number): Observable<any> {
    const now = new Date().toISOString();
    return this.http
      .post(`${this.apiUrl}/shifts/break/end/${userId}`, { breakEnd: now }, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => console.log('Break ended')),
        catchError(this.handleError<any>('endBreak'))
      );
  }

  /**
   * getMonthlyShifts => Example route or function to retrieve monthly shifts
   * (If you have a "shifts/monthly/:userId/:year/:month" endpoint)
   */
  getMonthlyShifts(userId: number, year: number, month: number): Observable<any> {
    const url = `${this.apiUrl}/shifts/monthly/${userId}/${year}/${month}`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      map(shifts => {
        // Example: parse each shift
        return shifts.map((shift: any) => {
          const shiftStart = this.parseLocalDateTime(shift.shiftStart);
          const shiftEnd = shift.shiftEnd ? this.parseLocalDateTime(shift.shiftEnd) : null;
          const breakDuration = this.calculateBreakDuration(shift.breaks);
          const totalDuration = this.calculateTotalDuration(shiftStart, shiftEnd, breakDuration);

          return {
            date: shiftStart
              ? shiftStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
              : '',
            day: shiftStart
              ? shiftStart.toLocaleDateString('de-DE', { weekday: 'short' })
              : '',
            total: this.formatDuration(totalDuration)
          };
        });
      }),
      catchError(this.handleError<any>('getMonthlyShifts', []))
    );
  }

  /** For monthly stats specifically: returns MonthlyStats object */
  getMonthlyStats(userId: number, year: number, month: number): Observable<MonthlyStats> {
    const url = `${this.apiUrl}/shifts/monthly-stats/${userId}/${year}/${month}`;
    return this.http.get<MonthlyStats>(url, { headers: this.getAuthHeaders() }).pipe(
      tap(stats => console.log('Fetched monthly stats:', stats)),
      catchError(this.handleError<MonthlyStats>('getMonthlyStats'))
    );
  }

  /** Internal helpers to calculate durations in getMonthlyShifts */
  private calculateBreakDuration(breaks: any[]): number {
    if (!breaks) return 0;
    return breaks.reduce((total: number, br: any) => {
      if (br.breakStart && br.breakEnd) {
        const start = this.parseLocalDateTime(br.breakStart);
        const end = this.parseLocalDateTime(br.breakEnd);
        if (start && end) {
          return total + (end.getTime() - start.getTime());
        }
      }
      return total;
    }, 0);
  }

  private calculateTotalDuration(start: Date | null, end: Date | null, breakDuration: number): number {
    if (!start || !end) return 0;
    // total shift time - break time
    return (end.getTime() - start.getTime()) - breakDuration;
  }

  private formatDuration(ms: number): string {
    // Convert ms to HH:mm
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * getShiftForDate => example route that returns a single shift & breaks for a given date
   */
  getShiftForDate(userId: number, date: Date): Observable<any> {
    // format date as "YYYY-MM-DD"
    const formattedDate = date.toLocaleDateString('en-CA'); // e.g. "2024-11-15"

    return this.http
      .get<any>(`${this.apiUrl}/shifts/date/${userId}/${formattedDate}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shift => console.log('Received raw shift data:', shift)),
        map(shift => {
          if (!shift) return null;

          // If the backend returns shiftStart/shiftEnd as "YYYY-MM-DD HH:mm:ss"
          // we can parse them for display or logic
          const parseDateTime = (dateTimeStr: string) => {
            const dt = this.parseLocalDateTime(dateTimeStr);
            if (!dt) return '';
            return dt.toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          };

          return {
            id: shift.id,
            shiftStart: parseDateTime(shift.shiftStart),
            shiftEnd: parseDateTime(shift.shiftEnd),
            breaks: (shift.breaks || []).map((b: any) => ({
              id: b.id,
              breakStart: this.parseLocalDateTime(b.breakStart),
              breakEnd: b.breakEnd ? this.parseLocalDateTime(b.breakEnd) : null
            }))
          };
        }),
        catchError(this.handleError<any>('getShiftForDate', null))
      );
  }
  getActiveShiftsCount(): Observable<number> {
    return this.http
      .get<{count: number}>(`${this.apiUrl}/shifts/count-active`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map(response => response.count),
        catchError(this.handleError<number>('getActiveShiftsCount', 0))
      );
  }
  getMonthlyTotalHours(): Observable<number> {
    return this.http
      .get<{hours: number}>(`${this.apiUrl}/shifts/hours-this-month`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map(response => response.hours),
        catchError(this.handleError<number>('getMonthlyTotalHours', 0))
      );
  }
}
