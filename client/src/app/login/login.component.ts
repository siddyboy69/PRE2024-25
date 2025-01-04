import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router, NavigationStart } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class LoginComponent implements OnInit, OnDestroy {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isButtonDisabled: boolean = false;
  passwordVisible: boolean = false; // New property to toggle password visibility
  private navigationSubscription!: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('last_username') || '';
    this.password = localStorage.getItem('last_password') || '';

    this.navigationSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isButtonDisabled = event.url === '/homepage' && this.userService.isLoggedIn();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  // Method to toggle password visibility
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  // login method
  login(): void {
    this.userService.login(this.username, this.password).subscribe({
      next: (user: any) => {
        console.log('Login successful:', user);

        // error message die man am screen sieht
        this.errorMessage = 'Login failed - Incorrect username or password.';
        const redirectUrl = user.isAdmin ? '/homepage' : '/homepage';

        this.router.navigate([redirectUrl]);
      },
      error: (err: any) => {
        console.log('Login failed:', err);
        this.errorMessage = err.error.message || 'Login failed. Please try again.';
      }
    });
  }
}
