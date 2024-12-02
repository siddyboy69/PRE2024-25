import { Component, OnInit } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  employees: any[] = [];
  isAdmin: boolean = false;
  currentDate: Date = new Date(); // Initialize currentDate as today's date
  displayDate: string = 'Heute';

  constructor(
    protected userService: UserService,
    private router: Router
  ) {
    this.isAdmin = this.userService.isAdmin();
    if (this.isAdmin) {
      this.fetchEmployee();
    }
  }

  ngOnInit(): void {
    // Update display date when component initializes
    this.updateDisplayDate();
  }

  // Fetch employees if the user is an admin
  fetchEmployee(): void {
    this.userService.getUsers().subscribe({
      next: (employees: any[]) => {
        console.log('Fetched employees:', employees);
        this.employees = employees;
      },
      error: err => console.error('Error fetching employees:', err)
    });
  }

  // Method to navigate to "Add Mitarbeiter"
  navigateToAddMitarbeiter(): void {
    this.router.navigate(['/add-mitarbeiter']);
  }

  // Method to navigate to employee details page
  navigateToDetail(id: number): void {
    this.router.navigate(['/mitarbeiter-detail', id]);
  }

  // Log Out Method
  logout(): void {
    this.userService.logout(); // Clear session
    this.router.navigate(['/']); // Redirect to login page
  }

  // Method to change the date (yesterday or tomorrow)
  changeDate(direction: number): void {
    // Create a new Date object to avoid mutating the original
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + direction);

    // Update the current date
    this.currentDate = newDate;

    // Update the display
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
}
