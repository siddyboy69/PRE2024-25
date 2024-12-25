import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Shift } from '../_model/shift';
import { MessageService } from './message.service';
import { map } from 'rxjs/operators';

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

  /** START a new shift */
  startShift(userId: number): Observable<any> {
    const shift = {
      userId: userId,
      shiftStart: new Date(),
    };

    return this.http.post(`${this.apiUrl}/shifts`, shift, { headers: this.getAuthHeaders() })
      .pipe(
        tap(_ => this.msg.addMessage('Schicht gestartet')),
        catchError(this.handleError<any>('startShift'))
      );
  }


  /** START a break */
  startBreak(shiftId: number): Observable<any> {
    const breakStart = {
      breakStart: new Date()
    };

    return this.http.put(`${this.apiUrl}/shifts/${shiftId}`, breakStart, { headers: this.getAuthHeaders() })
      .pipe(
        tap(_ => this.msg.addMessage('Pause gestartet')),
        catchError(this.handleError<any>('startBreak'))
      );
  }

  /** END a break */
  endBreak(shiftId: number): Observable<any> {
    const breakEnd = {
      breakEnd: new Date()
    };

    return this.http.put(`${this.apiUrl}/shifts/${shiftId}`, breakEnd, { headers: this.getAuthHeaders() })
      .pipe(
        tap(_ => this.msg.addMessage('Pause beendet')),
        catchError(this.handleError<any>('endBreak'))
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
}


