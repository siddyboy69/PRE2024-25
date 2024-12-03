import { Component, OnInit } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  employees: any[] = [];
  isAdmin: boolean = false;
  currentDate: Date = new Date(); // Initialize currentDate as today's date
  displayDate: string = 'Heute';
  selectedEmployeeId: number | null = null;
  shifts: any[] = [];
  //shifts: Object = [];
  newShift: any = {
    shiftStart: '',
    shiftEnd: '',
    breakStart: '',
    breakEnd: ''
  };

  constructor(
    protected userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {
    this.isAdmin = this.userService.isAdmin();
    if (this.isAdmin) {
      this.fetchEmployees();
    }
  }

  ngOnInit(): void {
    this.updateDisplayDate();
  }

  fetchEmployees(): void {
    this.userService.getUsers().subscribe({
      next: (employees) => (this.employees = employees),
      error: (err) => console.error('Error fetching employees:', err)
    });
  }

  navigateToAddMitarbeiter(): void {
    this.router.navigate(['/add-mitarbeiter']);
  }

  // Method to navigate to employee details page
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

  // Method to update the display date
  private updateDisplayDate(): void {
    const today = new Date();

    // If the current date is today, display 'Heute'
    if (this.isSameDay(this.currentDate, today)) {
      this.displayDate = 'Heute';
    } else {
      // Otherwise, format the date
      this.displayDate = this.formatDate(this.currentDate);
    }
  }

  // Helper method to check if two dates are the same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  // Helper method to format the date
  private formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  searchEmployee(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.employees = this.employees.filter((employee) =>
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(query)
    );
  }

  fetchShifts(employeeId: number): void {
    this.http.get<any[]>(`http://localhost:3000/users/shifts/${employeeId}`).subscribe({
      /*next: (shifts) => (this.shifts = shifts),
      error: (err) => console.error('Error fetching shifts:', err)*/

      next: (shifts) => (this.shifts = shifts),
      error: (err) => console.error('Error fetching shifts:', err)
    });
  }

  onEmployeeClick(employeeId: number): void {
    this.selectedEmployeeId = employeeId;
    this.fetchShifts(employeeId);
  }

  addShift(newShift: any): void {
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
    console.log('Report generation triggered.');
    this.http.get('http://localhost:3000/users/generate-report', {
      responseType: 'blob' // Expect a binary file (PDF)
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
