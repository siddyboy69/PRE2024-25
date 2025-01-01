import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Shift } from '../_model/shift';
import { MessageService } from './message.service';
import { map } from 'rxjs/operators';
import {MonthlyStats} from '../_model/monthly-stats';


@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private apiUrl = 'http://localhost:3000';  // Base URL matching your backend

  constructor(
    private http: HttpClient,
    private msg: MessageService
  ) { }

  /** GET shifts for specific user */
  getUserShifts(userId: number): Observable<Shift[]> {
    return this.http.get<any[]>(`${this.apiUrl}/shifts/user/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shifts => console.log('Fetched shifts:', shifts)),
        map(shifts => shifts.map(shift => new Shift(
          shift.id,
          shift.user_id,
          new Date(shift.shiftStart),
          shift.shiftEnd ? new Date(shift.shiftEnd) : null,
          shift.breakStart ? new Date(shift.breakStart) : null,
          shift.breakEnd ? new Date(shift.breakEnd) : null
        ))),
        catchError(this.handleError<Shift[]>('getUserShifts', []))
      );
  }

  /** GET all shifts (admin only) */
  getAllShifts(): Observable<Shift[]> {
    return this.http.get<any[]>(`${this.apiUrl}/shifts/all`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shifts => console.log('Fetched all shifts:', shifts)),
        map(shifts => shifts.map(shift => new Shift(
          shift.id,
          shift.user_id,
          new Date(shift.shiftStart),
          shift.shiftEnd ? new Date(shift.shiftEnd) : null,
          shift.breakStart ? new Date(shift.breakStart) : null,
          shift.breakEnd ? new Date(shift.breakEnd) : null
        ))),
        catchError(this.handleError<Shift[]>('getAllShifts', []))
      );
  }


  startShift(userId: number): Observable<any> {
    const now = new Date();
    return this.http.post(`${this.apiUrl}/shifts`, { userId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => console.log('ShiftService start response:', response)),
      catchError(this.handleError<any>('startShift'))
    );
  }

  /** DELETE a shift */
  deleteShift(shiftId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/shifts/${shiftId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(_ => this.msg.addMessage('Schicht gelöscht')),
        catchError(this.handleError<any>('deleteShift'))
      );
  }

  /** Helper function to handle errors */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.msg.addMessage(`${operation} fehlgeschlagen`);
      return of(result as T);
    };
  }

  /** Helper function to get auth headers */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  /** Get current active shift for a user */
  getCurrentShift(userId: number): Observable<Shift | null> {
    return this.getUserShifts(userId).pipe(
      map(shifts => shifts.find(shift => !shift.shiftEnd) || null),
      catchError(this.handleError<Shift | null>('getCurrentShift', null))
    );
  }

  /** Check if user is currently on break */
  isUserOnBreak(userId: number): Observable<boolean> {
    return this.getCurrentShift(userId).pipe(
      map(shift => shift ? shift.isOnBreak() : false),
      catchError(this.handleError<boolean>('isUserOnBreak', false))
    );
  }

  getActiveShift(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/shifts/active/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shift => console.log('Active shift:', shift)),
        catchError(this.handleError<any>('getActiveShift', null))
      );
  }
  endShift(userId: number): Observable<any> {
    const now = new Date();
    return this.http.put(`${this.apiUrl}/shifts/end/${userId}`,
      { shiftEnd: now.toISOString() },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => console.log('Shift ended:', response)),
      catchError(this.handleError<any>('endShift'))
    );
  }
  // In shift.service.ts
  getTodayShift(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/shifts/today/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(shift => console.log('Today shift:', shift)),
        catchError(this.handleError<any>('getTodayShift', null))
      );
  }
  startBreak(userId: number): Observable<any> {
    const now = new Date();
    return this.http.post(`${this.apiUrl}/shifts/break/start/${userId}`,
      { breakStart: now.toISOString() },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(_ => console.log('Break started')),
      catchError(this.handleError<any>('startBreak'))
    );
  }

  endBreak(userId: number): Observable<any> {
    const now = new Date();
    return this.http.post(`${this.apiUrl}/shifts/break/end/${userId}`,
      { breakEnd: now.toISOString() },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(_ => console.log('Break ended')),
      catchError(this.handleError<any>('endBreak'))
    );
  }
  getMonthlyShifts(userId: number, year: number, month: number): Observable<any> {
    const url = `${this.apiUrl}/shifts/monthly/${userId}/${year}/${month}`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      map(shifts => {
        return shifts.map((shift: any) => {
          const shiftStart = new Date(shift.shiftStart);
          const shiftEnd = shift.shiftEnd ? new Date(shift.shiftEnd) : null;
          const breakDuration = this.calculateBreakDuration(shift.breaks);
          const totalDuration = this.calculateTotalDuration(shiftStart, shiftEnd, breakDuration);

          return {
            date: shiftStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
            day: shiftStart.toLocaleDateString('de-DE', { weekday: 'short' }),
            total: this.formatDuration(totalDuration)
          };
        });
      })
    );
  }

  private calculateBreakDuration(breaks: any[]): number {
    if (!breaks) return 0;
    return breaks.reduce((total, breakItem) => {
      if (breakItem.breakStart && breakItem.breakEnd) {
        const start = new Date(breakItem.breakStart);
        const end = new Date(breakItem.breakEnd);
        return total + (end.getTime() - start.getTime());
      }
      return total;
    }, 0);
  }

  private calculateTotalDuration(start: Date, end: Date | null, breakDuration: number): number {
    if (!end) return 0;
    return (end.getTime() - start.getTime()) - breakDuration;
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  getShiftForDate(userId: number, date: Date): Observable<any> {
    const formattedDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format

    return this.http.get<any>(
      `${this.apiUrl}/shifts/date/${userId}/${formattedDate}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(shift => {
        console.log('Received raw shift data:', shift);
      }),
      map(shift => {
        if (!shift) return null;

        const parseDateTime = (dateTimeStr: string) => {
          if (!dateTimeStr) return null;
          const date = new Date(dateTimeStr);
          return date.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        };

        return {
          id: shift.id,
          shiftStart: parseDateTime(shift.shiftStart),
          shiftEnd: parseDateTime(shift.shiftEnd),
          breaks: shift.breaks.map((breakItem: any) => ({
            id: breakItem.id,
            breakStart: new Date(breakItem.breakStart),
            breakEnd: breakItem.breakEnd ? new Date(breakItem.breakEnd) : null
          }))
        };
      }),
      catchError(this.handleError<any>('getShiftForDate', null))
    );
  }
  getMonthlyStats(userId: number, year: number, month: number): Observable<MonthlyStats> {
    return this.http.get<MonthlyStats>(
      `${this.apiUrl}/shifts/monthly-stats/${userId}/${year}/${month}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(stats => console.log('Fetched monthly stats:', stats)),
      catchError(this.handleError<MonthlyStats>('getMonthlyStats'))
    );
  }
}


