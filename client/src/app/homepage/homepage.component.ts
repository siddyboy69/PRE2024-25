import { Component, OnInit } from '@angular/core';
import { UserService } from '../../_service/user.service';
import {Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../_service/message.service';
import { ShiftService } from '../../_service/shift.service';
import {Break} from '../../_model/break';
import {BreakService} from '../../_service/break.service';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {MatIconModule} from '@angular/material/icon';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';

interface Employee {
  id: number;
  firstname: string;
  lastname: string;
  isAdmin: boolean;
}

interface Shift {
  shiftStart: string;
  shiftEnd: string;
  breakStart?: string;
  breakEnd?: string;
}
interface BreakItem {
  id: number;
  breakStart: string;
  breakEnd: string | null;
}
interface ShiftResponse {
  id: number;
  shiftStart: string;
  shiftEnd: string | null;
  breaks: BreakItem[];
}
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatNativeDateModule, MatDatepickerModule, MatInputModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  employees: Employee[] = [];
  view_employees: Employee[] = [];
  isAdmin: boolean = false;
  currentDate: Date = new Date();
  displayDate: string = 'Heute';
  selectedEmployeeId: number | null = null;
  shifts: Shift[] = [];
  isSidebarOpen: boolean = false;
  activeShiftStart: string | null = null;
  activeShiftEnd: string | null = null;
  activeBreakStart: string | null = null;
  activeBreakEnd: string | null = null;
  isOnBreak: boolean = false;
  breakHistory: Array<{startTime: string, endTime: string | null}> = [];
  currentShiftId: number | null = null;
  currentBreakId: number | null = null;

  breaks: Break[] = [];
  newShift: Shift = {
    shiftStart: '',
    shiftEnd: '',
    breakStart: '',
    breakEnd: ''
  };
  private apiUrl = 'http://localhost:3000';
  constructor(
    protected userService: UserService,
    private router: Router,
    private http: HttpClient,
    private msg: MessageService,
    private shiftService: ShiftService,
    private breakService: BreakService
  ) {
    const storedUser = this.userService.loadUserFromLocalStorage();
    this.userService.user = storedUser;

    // Check admin status after user is loaded
    this.isAdmin = storedUser.isAdmin;
    console.log('Is Admin:', this.isAdmin); // Add for debugging

    if (this.isAdmin) {
      this.fetchEmployees();
    }
  }

  ngOnInit(): void {
    this.updateDisplayDate();
    if (!this.isAdmin) {
      this.checkForActiveShift();
    }
  }

  startBreak(): void {
    console.log('Starting break, currentShiftId:', this.currentShiftId); // Debug log

    if (!this.currentShiftId) {
      console.error('No active shift ID found');
      this.msg.addMessage('Keine aktive Schicht gefunden');
      return;
    }

    this.breakService.startBreak(this.currentShiftId).subscribe({
      next: (response) => {
        console.log('Break started successfully:', response); // Debug log

        // Update component state
        this.currentBreakId = response.breakId;
        this.isOnBreak = true;

        // Create new break object and add to array
        const newBreak = new Break(
          response.breakId,
          this.currentShiftId!,
          new Date(response.breakStart)
        );
        this.breaks.push(newBreak);

        // Show success message
        this.msg.addMessage('Pause wurde gestartet');
      },
      error: (err) => {
        console.error('Error starting break:', err);
        this.msg.addMessage('Fehler beim Starten der Pause');
      }
    });
  }

  endBreak(): void {
    if (this.currentBreakId) {
      this.breakService.endBreak(this.currentBreakId).subscribe({
        next: (response) => {
          const currentBreak = this.breaks.find(b => b.id === this.currentBreakId);
          if (currentBreak) {
            currentBreak.breakEnd = new Date();
          }
          this.currentBreakId = null;
          this.isOnBreak = false;
        },
        error: (err) => {
          console.error('Error ending break:', err);
          this.msg.addMessage('Fehler beim Beenden der Pause');
        }
      });
    }
  }

  loadBreaks(): void {
    if (this.currentShiftId) {
      this.breakService.getBreaks(this.currentShiftId).subscribe({
        next: (breaks) => {
          this.breaks = breaks;
          const activeBreak = breaks.find(b => !b.breakEnd);
          if (activeBreak) {
            this.currentBreakId = activeBreak.id;
            this.isOnBreak = true;
          }
        },
        error: (err) => console.error('Error loading breaks:', err)
      });
    }
  }
  endShift(): void {
    const userId = this.userService.user.id;
    this.shiftService.endShift(userId).subscribe({
      next: (response) => {
        console.log('Shift ended:', response);
        this.msg.addMessage('Schicht wurde beendet');
        this.activeShiftEnd = new Date().toLocaleTimeString('de-DE');
      },
      error: (err) => {
        console.error('Error ending shift:', err);
        this.msg.addMessage('Fehler beim Beenden der Schicht');
      }
    });
  }

  checkForActiveShift(): void {
    const userId = this.userService.user.id;
    this.shiftService.getShiftForDate(userId, this.currentDate).subscribe({
      next: (shift: ShiftResponse) => {
        if (shift) {
          // Handle shift times
          if (shift.shiftStart) {
            const shiftDate = new Date(shift.shiftStart.replace('Z', ''));
            this.activeShiftStart = shiftDate.toLocaleTimeString('de-DE');
            this.currentShiftId = shift.id;
          }

          if (shift.shiftEnd) {
            const endDate = new Date(shift.shiftEnd.replace('Z', ''));
            this.activeShiftEnd = endDate.toLocaleTimeString('de-DE');
          }

          // Handle breaks
          if (shift.breaks && shift.breaks.length > 0) {
            this.breaks = shift.breaks.map((breakItem: BreakItem) => {
              const breakStart = new Date(breakItem.breakStart.replace('Z', ''));
              const breakEnd = breakItem.breakEnd ?
                new Date(breakItem.breakEnd.replace('Z', '')) : null;

              return new Break(
                breakItem.id,
                shift.id,
                breakStart,
                breakEnd
              );
            });

            // Check if there's an active break
            const activeBreak = this.breaks.find(b => !b.breakEnd);
            if (activeBreak) {
              this.currentBreakId = activeBreak.id;
              this.isOnBreak = true;
            }
          }
        } else {
          // Reset states when no shift is found
          this.activeShiftStart = null;
          this.activeShiftEnd = null;
          this.breaks = [];
          this.currentShiftId = null;
          this.isOnBreak = false;
        }
      },
      error: (error: Error) => {
        console.error('Error checking shift:', error);
      }
    });
  }
  deleteEmployee(employeeId: number, event: Event): void {
    event.stopPropagation();
    const confirmDelete = confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?');

    if (confirmDelete) {
      if (employeeId) {
        this.userService.deleteUser(employeeId).subscribe({
          next: (response) => {
            console.log('Employee deleted:', response);
            this.msg.addMessage('Mitarbeiter erfolgreich gelöscht');
            this.view_employees = this.employees.filter(emp => emp.id !== employeeId);
            this.employees = this.employees.filter(emp => emp.id !== employeeId);

            if (this.selectedEmployeeId === employeeId) {
              this.selectedEmployeeId = null;
            }
          },
          error: (err) => {
            console.error('Error deleting employee:', err);
            this.msg.addMessage('Fehler beim Löschen des Mitarbeiters');
          }
        });
      } else {
        console.error('Keine Mitarbeiter-ID gefunden');
        this.msg.addMessage('Keine Mitarbeiter-ID gefunden');
      }
    }
  }
  startShift(): void {
    const userId = this.userService.user.id;
    this.shiftService.startShift(userId).subscribe({
      next: (response) => {
        console.log('Shift started response:', response); // Debug log
        this.msg.addMessage('Schicht wurde gestartet');
        this.activeShiftStart = new Date().toLocaleTimeString('de-DE');
        this.currentShiftId = response.shiftId;  // Store the shift ID!
        console.log('Current shift ID set to:', this.currentShiftId); // Debug log
      },
      error: (err) => {
        console.error('Error starting shift:', err);
        this.msg.addMessage('Fehler beim Starten der Schicht');
      }
    });
  }
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  fetchEmployees(): void {
    this.userService.getUsers().subscribe({
      next: (employees) => {
        console.log('Received employees:', employees);
        this.employees = employees;
        this.view_employees = employees;
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.msg.addMessage('Error fetching employees');
      }
    });
  }

  navigateToAddMitarbeiter(): void {
    this.router.navigate(['/add-mitarbeiter']);
  }

  navigateToDetail(id: number): void {
    this.selectedEmployeeId = id;
    this.router.navigate(['/mitarbeiter-detail', id]);
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/']);
  }

  changeDate(direction: number): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + direction);
    this.currentDate = newDate;
    this.updateDisplayDate();
    if (!this.isAdmin) {
      this.checkForActiveShift();  // Add this line
    }
  }
  getShiftForDate(userId: number, date: Date): Observable<any> {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<any>(`${this.apiUrl}/shifts/date/${userId}/${formattedDate}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(shift => console.log('Fetched shift for date:', shift)),
      catchError(this.handleError<any>('getShiftForDate', null))
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

  private updateDisplayDate(): void {
    const today = new Date();
    this.displayDate = this.isSameDay(this.currentDate, today)
      ? 'Heute'
      : this.formatDate(this.currentDate);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  searchEmployee(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.view_employees = this.employees.filter((employee) =>
      `${employee.firstname} ${employee.lastname}`.toLowerCase().includes(query)
    );

    if (this.view_employees.length === 0) {
      this.view_employees = [{
        id: -1,
        firstname: 'Mitarbeiter',
        lastname: 'nicht gefunden',
        isAdmin: false
      }];
    }
  }

  fetchShifts(employeeId: number): void {
    this.http.get<Shift[]>(`http://localhost:3000/users/shifts/${employeeId}`).subscribe({
      next: (shifts) => (this.shifts = shifts),
      error: (err) => console.error('Error fetching shifts:', err)
    });
  }

  onEmployeeClick(employeeId: number): void {
    this.selectedEmployeeId = employeeId;
    this.fetchShifts(employeeId);
    this.router.navigate(['/mitarbeiter-detail', employeeId]);
  }

  addShift(newShift: Shift): void {
    this.http.post('http://localhost:3000/users/shifts', newShift).subscribe({
      next: () => {
        if (this.selectedEmployeeId) {
          this.fetchShifts(this.selectedEmployeeId);
        }
      },
      error: (err) => console.error('Error adding shift:', err)
    });
  }

  generateReport(): void {
    this.http.get('http://localhost:3000/users/generate-report', {
      responseType: 'blob'
    }).subscribe({
      next: (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'work-hours-report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error generating report:', err);
      }
    });
  }
  onDateSelected(date: Date | null): void {
    if (date) {
      this.currentDate = date;
      this.updateDisplayDate();
      if (!this.isAdmin) {
        this.checkForActiveShift();
      }
    }
  }
}
