import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { User } from '../_model/user';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User = this.loadUserFromLocalStorage();
  private apiUrl = 'http://localhost:3000';  // Base URL for your backend API

  constructor(private http: HttpClient, private msg: MessageService) {}

  // Check if a user is logged in by verifying if user ID is non-zero and token exists
  isLoggedIn(): boolean {
    return this.user && this.user.id !== 0 && localStorage.getItem('auth_token') !== null;
  }

  // Check if the current user has admin privileges
  isAdmin(): boolean {
    return this.user && this.user.isAdmin;
  }

  // Handle user login, storing both user data and JWT token in local storage on success
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/login`, {
      username: username,
      password: password
    }).pipe(
      tap(response => {
        // Display a success message
        this.msg.addMessage('Login successful');

        // Store user data and JWT token
        this.user = response.user;
        this.saveUserToLocalStorage(this.user);
        localStorage.setItem('auth_token', response.token);

        // Temporarily store the last used username and password
        localStorage.setItem('last_username', username);
        localStorage.setItem('last_password', password);
      }),
      catchError(_ => {
        // Display a failure message on login error
        this.msg.addMessage('Login failed');
        return of(null); // Return null observable on error
      })
    );
  }

  // Register method for creating a new user
  register(username: string, password: string, email: string, firstName: string, lastName: string, sex: string, address: string, postalcode: string, city: string, country: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/register`, {
      username: username,
      password: password,
      firstname: firstName,
      lastname: lastName,
      sex: sex,
      email: email,
      address: address,
      postalcode: postalcode,
      city: city,
      country: country
    }).pipe(
      tap(res => {
        this.msg.addMessage('Register successful');
        // Avoid changing the current user (admin).
        console.log('New user created: ', res);
      }),
      catchError(_ => {
        this.msg.addMessage('Register failed');
        return of(new User(0, '', '', '', false, '', '', '')); // Return a default User object on error
      })
    );
  }

  // Fetch all non-admin users from the backend
  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getAuthHeaders() }).pipe(
      tap(res => {
        console.log('Users fetched:', res);
      }),
      catchError(err => {
        if (err.status === 401) {
          this.logout();
          this.msg.addMessage('Session expired. Please log in again.');
        }
        console.error('Error fetching users:', err);
        return of([]);
      })
    );
  }

  // Fetch user details by ID, ensuring it returns an Observable<User>
  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(employeeData => new User(
        employeeData.id,
        employeeData.uuid,
        employeeData.username,
        '', // Password can be set to an empty string for detail views
        employeeData.is_admin || false,
        employeeData.firstname,
        employeeData.lastname,
        employeeData.sex
      )),
      catchError(err => {
        if (err.status === 401) {
          this.logout();
          this.msg.addMessage('Session expired. Please log in again.');
        }
        return of(new User(0, '', '', '', false, '', '', '')); // Return a default User object on error
      })
    );
  }

  // Clear user data and JWT token from both the service and local storage on logout
  logout(): void {
    this.user = new User(0, '', '', '', false, '', '', ''); // Reset user data
    localStorage.removeItem('loggedInUser'); // Clear user data from local storage
    localStorage.removeItem('auth_token'); // Clear the JWT token from local storage
    this.msg.addMessage('Logout successful'); // Optionally add a logout message

    // Refresh the page to clear cached data and inputs
    window.location.href = '/';
  }

  // Save user data to local storage
  private saveUserToLocalStorage(user: User): void {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  }

  // Load user data from local storage, now public so it can be accessed as needed
  public loadUserFromLocalStorage(): User {
    const storedUser = localStorage.getItem('loggedInUser');
    return storedUser ? JSON.parse(storedUser) as User : new User(0, '', '', '', false, '', '', '');
  }

  // Helper function to create headers with authorization token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Delete a user by ID
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/delete/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(err => {
        this.msg.addMessage('Error deleting user');
        console.error('Error deleting user:', err);
        return of(null);
      })
    );
  }
}
