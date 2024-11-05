import {Component, OnInit} from '@angular/core';
import { UserService } from '../../_service/user.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  imports: [FormsModule, RouterLink, CommonModule],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private userService: UserService, private router: Router, private location: Location) {}

  login(): void {
    this.userService.login(this.username, this.password).subscribe({
      next: (user: any) => {
        console.log('Login successful:', user);
        this.errorMessage = ''; // Clear any existing error message
        const redirectUrl = localStorage.getItem('redirectUrl') || '';
        localStorage.removeItem('redirectUrl');
        this.router.navigate([redirectUrl || '']).then(() => {
          this.location.replaceState(''); // Clear the login page from browser history
        });
      },
      error: (err: any) => {
        console.log('Login failed:', err);
        this.errorMessage = 'Login failed. Please check your credentials and try again.';
      }
    });
  }

  ngOnInit(): void {
  }
}
