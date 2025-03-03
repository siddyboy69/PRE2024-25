import { Component } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass } from "@angular/common";

@Component({
  selector: 'app-add-mitarbeiter',
  standalone: true,
  templateUrl: './add-mitarbeiter.component.html',
  imports: [
    FormsModule,
    NgIf,
    NgClass
  ],
  styleUrls: ['./add-mitarbeiter.component.css']
})
export class AddMitarbeiterComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  sex: string = '';
  isPasswordMatch: boolean = false;
  passwordStrengthValue: number = 0;
  passwordStrengthText: string = 'Sehr schwach';
  passwordStrengthColor: string = 'weak';

  constructor(private userService: UserService, private router: Router) {}

  addEmployee(): void {
    const employeeData = {
      username: this.username,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      sex: this.sex
    };

    this.userService.register(
      this.username, this.password, '', this.firstName, this.lastName, this.sex, '', '', '', ''
    ).subscribe({
      next: (data) => {
        console.log(data, 'Employee added successfully');
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

  checkPasswordMatch(): void {
    this.isPasswordMatch = this.password === this.confirmPassword;
  }

  checkPasswordStrength(): void {
    if (!this.password) {
      this.passwordStrengthValue = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthColor = 'empty';
      return;
    }

    let strength = 0;
    if (this.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(this.password)) strength += 1;
    if (/[0-9]/.test(this.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(this.password)) strength += 1;

    this.passwordStrengthValue = (strength / 4) * 100;

    if (this.passwordStrengthValue <= 20) {
      this.passwordStrengthText = 'Sehr schwach';
      this.passwordStrengthColor = 'very-weak';
    } else if (this.passwordStrengthValue <= 40) {
      this.passwordStrengthText = 'Schwach';
      this.passwordStrengthColor = 'weak';
    } else if (this.passwordStrengthValue <= 60) {
      this.passwordStrengthText = 'Mittel';
      this.passwordStrengthColor = 'medium';
    } else if (this.passwordStrengthValue <= 80) {
      this.passwordStrengthText = 'Stark';
      this.passwordStrengthColor = 'strong';
    } else {
      this.passwordStrengthText = 'Sehr stark';
      this.passwordStrengthColor = 'very-strong';
    }
  }


}
