import { Component } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass } from "@angular/common";

@Component({
  selector: 'app-add-mitarbeiter',
  standalone: true,
  templateUrl: './add-mitarbeiter.component.html',
  imports: [FormsModule, NgIf, NgClass],
  styleUrls: ['./add-mitarbeiter.component.css']
})
export class AddMitarbeiterComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  sex: string = '';
  isPasswordMatch: boolean = true;

  constructor(private userService: UserService, private router: Router) {}

  checkPasswordMatch(): void {
    this.isPasswordMatch = this.password === this.confirmPassword;
  }

  addEmployee(): void {
    if (!this.isPasswordMatch) {
      console.error("Passwords do not match!");
      return;
    }

    this.userService.register(
      this.username, this.password, '', this.firstName, this.lastName, this.sex, '', '', '', ''
    ).subscribe({
      next: () => {
        console.log('Employee added successfully');
        this.router.navigate(['/homepage']);
      },
      error: (err) => {
        console.error('Failed to add employee:', err);
      }
    });
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.router.navigate(['/homepage']);
  }
}
