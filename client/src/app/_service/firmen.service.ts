import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, of } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { Firmen } from '../_model/firmen'

@Injectable({
  providedIn: 'root'
})
export class FirmenService {
  private apiUrl = 'http://localhost:3000'

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token')
    return new HttpHeaders({ Authorization: `Bearer ${token}` })
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error)
      return of(result as T)
    }
  }

  createFirma(bezeichnung: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/firmen`, { bezeichnung }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError('createFirma')))
  }

  getFirmen(): Observable<Firmen[]> {
    return this.http.get<Firmen[]>(`${this.apiUrl}/firmen`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError<Firmen[]>('getFirmen', [])))
  }

  getFirma(id: number): Observable<Firmen> {
    return this.http.get<Firmen>(`${this.apiUrl}/firmen/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError<Firmen>('getFirma')))
  }

  updateFirma(id: number, bezeichnung: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/firmen/${id}`, { bezeichnung }, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError('updateFirma')))
  }

  deleteFirma(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/firmen/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError('deleteFirma')))
  }
}
