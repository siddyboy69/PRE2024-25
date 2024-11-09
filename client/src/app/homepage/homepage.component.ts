import { Component } from '@angular/core';
import { UserService } from '../../_service/user.service';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {
  employees: any[] = [];
  isAdmin: boolean = false;

  constructor(private userService: UserService,private router: Router) {
    this.isAdmin = this.userService.isAdmin();
    if (this.isAdmin) {
      this.fetchEmployee();
    }
  }

  fetchEmployee(): void {
    this.userService.getUsers().subscribe({
      next: (employees: any[]) => {
        console.log('Fetched employees:', employees);
        this.employees = employees;
      },
      error: err => console.error('Error fetching employees:', err)
    });
  }
  navigateToAddMitarbeiter(): void {
    this.router.navigate(['/add-mitarbeiter']);
  }
  navigateToDetail(id: number): void {
    this.router.navigate(['/mitarbeiter-detail', id]);
  }

}
