// break.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Break } from '../_model/break';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class BreakService {
  private apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private msg: MessageService
  ) { }

  startBreak(shiftId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/shifts/break/start/${shiftId}`, {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(_ => this.msg.addMessage('Pause gestartet')),
      catchError(this.handleError<any>('startBreak'))
    );
  }

  endBreak(breakId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/shifts/break/end/${breakId}`, {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(_ => this.msg.addMessage('Pause beendet')),
      catchError(this.handleError<any>('endBreak'))
    );
  }

  getBreaks(shiftId: number): Observable<Break[]> {
    return this.http.get<Break[]>(`${this.apiUrl}/shifts/breaks/${shiftId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(breaks => console.log('Fetched breaks:', breaks)),
      catchError(this.handleError<Break[]>('getBreaks', []))
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.msg.addMessage(`${operation} fehlgeschlagen`);
      return of(result as T);
    };
  }
}
