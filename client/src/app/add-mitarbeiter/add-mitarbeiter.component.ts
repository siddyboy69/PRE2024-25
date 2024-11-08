import { Component } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router } from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-add-mitarbeiter',
  standalone: true,
  templateUrl: './add-mitarbeiter.component.html',
  imports: [
    FormsModule
  ],
  styleUrls: ['./add-mitarbeiter.component.css']
})
export class AddMitarbeiterComponent {
  firstName: string = '';
  lastName: string = '';
  username: string = '';
  password: string = '';
  sex: string = '';

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
      next: () => {
        console.log('Employee added successfully');
        this.router.navigate(['/homepage']);
      },
      error: (err) => {
        console.error('Failed to add employee:', err);
      }
    });
  }
}
