// frontend/_service/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:3000/reports';

  constructor(private http: HttpClient) {}

  downloadReport(): Observable<Blob> {
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.get(`${this.apiUrl}/download-report`, { headers, responseType: 'blob' });
  }
}
