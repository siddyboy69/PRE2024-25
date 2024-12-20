import { Component, OnInit } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {MessageService} from '../../_service/message.service';
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

interface Shift {
  shiftStart: string;
  shiftEnd: string;
  breakStart?: string;
  breakEnd?: string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  newShift: Shift = {
    shiftStart: '',
    shiftEnd: '',
    breakStart: '',
    breakEnd: ''
  };

  constructor(
    protected userService: UserService,
    private router: Router,
    private http: HttpClient,
    private msg: MessageService
  ) {
    this.isAdmin = this.userService.isAdmin();
    if (this.isAdmin) {
      this.fetchEmployees();
    }
  }

  ngOnInit(): void {
    this.updateDisplayDate();
  }
  deleteEmployee(employeeId: number, event: Event): void {
    event.stopPropagation(); // Prevent triggering other click events

    // Confirmation dialog in German
    const confirmDelete = confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?');

    if (confirmDelete) {
      if (employeeId) {
        this.userService.deleteUser(employeeId).subscribe({
          next: (response) => {
            console.log('Employee deleted:', response);
            this.msg.addMessage('Mitarbeiter erfolgreich gelöscht');

            // Remove the employee from the local list
            this.view_employees = this.employees.filter(emp => emp.id !== employeeId);
            this.employees = this.employees.filter(emp => emp.id !== employeeId);

            // If the deleted employee was the selected one, reset selection
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
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  fetchEmployees(): void {
    this.userService.getUsers().subscribe({
      next: (employees) => (this.employees = employees, this.view_employees = employees),
      error: (err) => console.error('Error fetching employees:', err)
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
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query)
    );

    // Add a check for empty results
    if (this.view_employees.length === 0) {
      this.view_employees = [{
        id: -1, // Use a sentinel ID
        firstName: 'Mitarbeiter',
        lastName: 'nicht gefunden',
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

    // Fetch shifts first
    this.fetchShifts(employeeId);

    // Navigate to the employee details page
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
}
