import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../_service/user.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../_service/message.service';
import { ShiftService } from '../_service/shift.service';
import { Break } from '../_model/break';
import { BreakService } from '../_service/break.service';
import { Observable, of } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatDatepicker } from '@angular/material/datepicker';
import {ReportService} from '../_service/report.service';

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

interface ShiftResponse {
  id: number;
  shiftStart: string;
  shiftEnd: string | null;
  breaks: BreakItem[];
}

interface BreakItem {
  id: number;
  breakStart: string;
  breakEnd: string | null;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatNativeDateModule, MatDatepickerModule, MatInputModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  @ViewChild('picker') picker!: MatDatepicker<Date>;


  employees: Employee[] = [];
  view_employees: Employee[] = [];
  isAdmin: boolean = false;
  selectedEmployeeId: number | null = null;

  // Date related properties
  currentDate: Date = new Date();
  displayDate: string = 'Heute';

  // Shift related properties
  shifts: Shift[] = [];
  activeShiftStart: string | null = null;
  activeShiftEnd: string | null = null;
  currentShiftId: number | null = null;

  // Break related properties
  breaks: Break[] = [];
  activeBreakStart: string | null = null;
  activeBreakEnd: string | null = null;
  isOnBreak: boolean = false;
  currentBreakId: number | null = null;
  breakHistory: Array<{startTime: string, endTime: string | null}> = [];

  // UI state
  isSidebarOpen: boolean = false;

  // Form related properties
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
    private breakService: BreakService,
    private reportService: ReportService
  ) {
    const storedUser = this.userService.loadUserFromLocalStorage();
    this.userService.user = storedUser;
    this.isAdmin = storedUser.isAdmin;

    if (this.isAdmin) {
      this.fetchEmployees();
    }
  }

  ngOnInit(): void {
    this.updateDisplayDate();

    if (this.isAdmin) {
      this.fetchEmployees();
      this.fetchActiveShiftsCount();
      this.fetchMonthlyHours();
      this.fetchWeeklyStats();

      setInterval(() => {
        this.fetchActiveShiftsCount();
        this.fetchMonthlyHours();
      }, 60000);
    } else {
      this.checkForActiveShift();
    }
  }

  // Date handling methods
  onDateSelected(date: Date | null): void {
    if (date) {
      this.currentDate = date;
      this.updateDisplayDate();
      if (!this.isAdmin) {
        this.checkForActiveShift();
      }
    }
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

  changeDate(direction: number): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + direction);
    this.currentDate = newDate;
    this.updateDisplayDate();
    if (!this.isAdmin) {
      this.checkForActiveShift();
    }
  }

  // Shift management methods
  startShift(): void {
    const userId = this.userService.user.id;
    this.shiftService.startShift(userId).subscribe({
      next: (response) => {
        this.msg.addMessage('Schicht wurde gestartet');
        this.activeShiftStart = new Date().toLocaleTimeString('de-DE');
        this.currentShiftId = response.shiftId;
      },
      error: (err) => {
        console.error('Error starting shift:', err);
        this.msg.addMessage('Fehler beim Starten der Schicht');
      }
    });
  }

  endShift(): void {
    const userId = this.userService.user.id;
    this.shiftService.endShift(userId).subscribe({
      next: (response) => {
        this.msg.addMessage('Schicht wurde beendet');
        this.activeShiftEnd = new Date().toLocaleTimeString('de-DE');
      },
      error: (err) => {
        console.error('Error ending shift:', err);
        this.msg.addMessage('Fehler beim Beenden der Schicht');
      }
    });
  }

  // Break management methods
  startBreak(): void {
    if (!this.currentShiftId) {
      this.msg.addMessage('Keine aktive Schicht gefunden');
      return;
    }

    this.breakService.startBreak(this.currentShiftId).subscribe({
      next: (response) => {
        this.currentBreakId = response.breakId;
        this.isOnBreak = true;
        const newBreak = new Break(
          response.breakId,
          this.currentShiftId!,
          new Date(response.breakStart)
        );
        this.breaks.push(newBreak);
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
  // Employee management methods
  employeeCount: number = 0;
  fetchEmployees(): void {
    this.userService.getUsers().subscribe({
      next: (employees) => {
        this.employees = employees;
        this.view_employees = employees;
        this.employeeCount = employees.length;
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.msg.addMessage('Error fetching employees');
      }
    });
  }
  activeShiftsCount: number = 0;
  fetchActiveShiftsCount(): void {
    this.shiftService.getActiveShiftsCount().subscribe({
      next: (count) => {
        console.log('Raw count value received:', count);
        this.activeShiftsCount = count;
      },
      error: (err) => {
        console.error('Error fetching active shifts count:', err);
      }
    });
  }
  deleteEmployee(employeeId: number, event: Event): void {
    event.stopPropagation();
    const confirmDelete = confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter in den Papierkorb verschieben möchten?');

    if (confirmDelete && employeeId) {
      this.userService.softDeleteUser(employeeId).subscribe({
        next: (response) => {
          this.msg.addMessage('Mitarbeiter erfolgreich in den Papierkorb verschoben');
          this.view_employees = this.employees.filter(emp => emp.id !== employeeId);
          this.employees = this.employees.filter(emp => emp.id !== employeeId);

          if (this.selectedEmployeeId === employeeId) {
            this.selectedEmployeeId = null;
          }
        },
        error: (err) => {
          console.error('Error moving employee:', err);
          this.msg.addMessage('Fehler beim Verschieben des Mitarbeiters');
        }
      });
    }
  }
  // In homepage.component.ts, modify the checkForActiveShift() method:
  checkForActiveShift(): void {
    const userId = this.userService.user.id;
    this.shiftService.getShiftForDate(userId, this.currentDate).subscribe({
      next: (shift: any) => {
        if (shift) {
          console.log('Retrieved shift:', shift); // Add this for debugging

          // Set shift times - these should be string times from the backend
          this.activeShiftStart = shift.shiftStart;
          this.activeShiftEnd = shift.shiftEnd;
          this.currentShiftId = shift.id;

          // Handle all breaks
          if (shift.breaks && Array.isArray(shift.breaks)) {
            this.breaks = shift.breaks
              .sort((a: { breakStart: string }, b: { breakStart: string }) =>
                new Date(a.breakStart).getTime() - new Date(b.breakStart).getTime()
              )
              .map((breakItem: {
                id: number;
                breakStart: string;
                breakEnd: string | null
              }) => new Break(
                breakItem.id,
                this.currentShiftId!,
                new Date(breakItem.breakStart),
                breakItem.breakEnd ? new Date(breakItem.breakEnd) : null
              ));

            // Check for active break
            const activeBreak = this.breaks.find(b => !b.breakEnd);
            if (activeBreak) {
              this.currentBreakId = activeBreak.id;
              this.isOnBreak = true;
            } else {
              this.isOnBreak = false;
            }
          } else {
            this.breaks = [];
            this.isOnBreak = false;
          }

          // Add this console log to debug button states
          console.log('After processing shift data:',
            {
              activeShiftStart: this.activeShiftStart,
              activeShiftEnd: this.activeShiftEnd,
              currentShiftId: this.currentShiftId,
              isOnBreak: this.isOnBreak,
              currentBreakId: this.currentBreakId
            }
          );
        } else {
          this.resetShiftStates();
        }
      },
      error: (error: Error) => {
        console.error('Error checking shift:', error);
        this.resetShiftStates();
      }
    });
  }

  // Navigation methods
  navigateToAddMitarbeiter(): void {
    this.router.navigate(['/add-mitarbeiter']);
  }

  navigateToDetail(id: number): void {
    this.selectedEmployeeId = id;
    this.router.navigate(['/mitarbeiter-detail', id]);
  }
  fetchShifts(employeeId: number): void {
    this.http.get<Shift[]>(`${this.apiUrl}/shifts/user/${employeeId}`,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (shifts) => {
        this.shifts = shifts;
      },
      error: (err) => {
        console.error('Error fetching shifts:', err);
        this.msg.addMessage('Fehler beim Laden der Schichten');
      }
    });
  }
  onEmployeeClick(employeeId: number): void {
    this.selectedEmployeeId = employeeId;
    this.fetchShifts(employeeId);
    this.router.navigate(['/mitarbeiter-detail', employeeId]);
  }

  // UI methods
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
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

  // Utility methods
  private resetShiftStates(): void {
    this.activeShiftStart = null;
    this.activeShiftEnd = null;
    this.breaks = [];
    this.currentShiftId = null;
    this.currentBreakId = null;
    this.isOnBreak = false;
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

  // Additional methods
  logout(): void {
    this.userService.logout();
    this.router.navigate(['/']);
  }

  /*generateReport(): void {
    this.reportService.downloadReport().subscribe({
      next: (blob: Blob) => {
        // Create a URL for the blob and trigger a download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'report.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading report:', err);
      }
    });
  }*/

  generateReport(employee: Employee): void {
    // For demonstration, let's pick the current year/month from your existing properties
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;  // 1-based

    this.reportService.downloadReport(employee.id, year, month).subscribe({
      next: (blob: Blob) => {
        // Create a URL for the blob and trigger a download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Report_${employee.firstname}_${employee.lastname}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading report:', err);
      }
    });
  }

  openUserSettings(): void {
      this.router.navigate(['/verwaltung']);
  }

  navigateToBin(): void {
    this.router.navigate(['/bin']);
  }

  monthlyHours: number = 0;
  fetchMonthlyHours(): void {
    this.shiftService.getMonthlyTotalHours().subscribe({
      next: (hours) => {
        this.monthlyHours = hours;
      },
      error: (err) => {
        console.error('Error fetching monthly hours:', err);
      }
    });
  }

  selectedEmployeeName: string = '';
  chartData: Array<{dayName: string, hours: number, height: number}> = [];
  weeklyStatsData: any = null;
  private dayNames: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  onEmployeeSelectChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;

    if (selectedValue === '') {
      this.chartData = [];
      this.selectedEmployeeName = '';
      return;
    }

    if (selectedValue === 'all') {
      this.selectedEmployeeId = null;
      this.selectedEmployeeName = 'All Employees Combined';
      this.updateChartData('all');
    } else {
      this.selectedEmployeeId = parseInt(selectedValue);
      const selectedEmployee = this.employees.find(emp => emp.id === this.selectedEmployeeId);
      this.selectedEmployeeName = selectedEmployee ?
        `${selectedEmployee.firstname} ${selectedEmployee.lastname}` : 'Selected Employee';
      this.updateChartData(this.selectedEmployeeId);
    }
  }
  fetchWeeklyStats(): void {
    this.http.get<any>(`${this.apiUrl}/shifts/weekly-stats`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (response) => {
          console.log('Weekly stats response:', response);
          this.weeklyStatsData = response;
          // Update chart if an employee is selected
          if (this.selectedEmployeeId !== null) {
            this.updateChartData(this.selectedEmployeeId);
          } else if (this.selectedEmployeeName === 'All Employees Combined') {
            this.updateChartData('all');
          }
        },
        error: (err) => {
          console.error('Error fetching weekly stats:', err);
          this.msg.addMessage('Error fetching weekly statistics');
        }
      });
  }
  private updateChartData(employeeIdOrAll: number | 'all'): void {
    if (!this.weeklyStatsData) {
      return;
    }

    const workDays = this.weeklyStatsData.weekDays;
    let hoursData: number[] = [];

    if (employeeIdOrAll === 'all') {
      // Calculate combined hours for all employees
      for (let i = 0; i < workDays.length; i++) {
        const dayKey = workDays[i];
        let totalHours = 0;

        this.weeklyStatsData.workers.forEach((worker: any) => {
          const dayHours = worker[`${dayKey}_hours`] || 0;
          totalHours += dayHours;
        });

        hoursData.push(totalHours);
      }
    } else {
      // Get data for specific employee
      const selectedWorker = this.weeklyStatsData.workers.find((worker: any) => worker.id === employeeIdOrAll);

      if (selectedWorker) {
        for (let i = 0; i < workDays.length; i++) {
          const dayKey = workDays[i];
          const hours = selectedWorker[`${dayKey}_hours`] || 0;
          hoursData.push(hours);
        }
      }
    }

    // Create chart data with heights for visualization
    const maxHours = Math.max(...hoursData, 1); // Avoid division by zero
    this.chartData = hoursData.map((hours, index) => ({
      dayName: this.dayNames[index],
      hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
      height: (hours / maxHours) * 150 // Scale to max 150px height
    }));
  }
}
