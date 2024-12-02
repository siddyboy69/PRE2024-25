import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../_service/user.service';
import { Router, NavigationStart } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Add FormsModule here
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule] // Add FormsModule here as well
})
export class LoginComponent implements OnInit, OnDestroy {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isButtonDisabled: boolean = false; // Flag for disabling the button
  private navigationSubscription!: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Retrieve and set stored username and password (if they exist)
    this.username = localStorage.getItem('last_username') || '';
    this.password = localStorage.getItem('last_password') || '';

    // Listen to router events to check navigation
    this.navigationSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Set isButtonDisabled to true if the navigation comes from the homepage and the user is logged in
        this.isButtonDisabled = event.url === '/homepage' && this.userService.isLoggedIn();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  // Method to handle login
  login(): void {
    if (this.isButtonDisabled) return; // Prevent action if button is disabled

    this.userService.login(this.username, this.password).subscribe({
      next: (user: any) => {
        console.log('Login successful:', user);
        this.errorMessage = ''; // Clear any existing error message
        const redirectUrl = user.isAdmin ? '/homepage' : '/homepage';

        // Navigate to the redirect URL and replace the login URL in the history
        this.router.navigate([redirectUrl]).then(() => {
          this.location.replaceState('/homepage');
        });
      },
      error: (err: any) => {
        console.log('Login failed:', err);
        this.errorMessage = 'Login failed. Please check your credentials and try again.';
      }
    });
  }
}
