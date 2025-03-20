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

  downloadReport(employeeId: number, year: number, month: number): Observable<Blob> {
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // Send them as query params: /reports/download-report?employeeId=xx&year=yy&month=mm
    return this.http.get(
      `${this.apiUrl}/download-report?employeeId=${employeeId}&year=${year}&month=${month}`,
      { headers, responseType: 'blob' }
    );
  }

}
