import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { User } from '../_model/user';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User = this.loadUserFromLocalStorage();

  constructor(private http: HttpClient, private msg: MessageService) { }

  // Check if a user is logged in by verifying if user ID is non-zero
  isLoggedIn(): boolean {
    return this.user && this.user.id !== 0;
  }

  // Check if the current user has admin privileges
  isAdmin(): boolean {
    return this.user && this.user.isAdmin;
  }

  // Handle user login and store user data in local storage on success
  login(username: string, password: string): Observable<User> {
    return this.http.post<User>('http://localhost:3000/users/login', {
      username: username,
      password: password
    }).pipe(
      tap(res => {
        this.msg.addMessage('Login successful');
        this.user = res;
        this.saveUserToLocalStorage(this.user); // Save user to local storage
      }),
      catchError(_ => {
        this.msg.addMessage('Login failed');
        return of();
      })
    );
  }

  // Register a new user and store user data in local storage on success
  register(username: string, password: string, email: string, firstName: string, lastName: string, sex: string, address: string, postalcode: string, city: string, country: string): Observable<User> {
    return this.http.post<User>('http://localhost:3000/users/register', {
      username: username,
      password: password,
      firstname: firstName, // Ensure correct field name
      lastname: lastName,   // Ensure correct field name
      sex: sex
    }).pipe(
      tap(res => {
        this.msg.addMessage('Register successful');
        this.user = res;
        this.saveUserToLocalStorage(this.user); // Save user to local storage
      }),
      catchError(_ => {
        this.msg.addMessage('Register failed');
        return of();
      })
    );
  }

  // Fetch all non-admin users from the backend
  getUsers(): Observable<any> {
    return this.http.get<any>('http://localhost:3000/users').pipe(
      tap(res => {
        console.log('Users fetched:', res);
      }),
      catchError(err => {
        console.error('Error fetching users:', err);
        return of([]);
      })
    );
  }

  // Fetch user details by ID
  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`http://localhost:3000/users/${id}`).pipe(
      map(employeeData => new User(
        employeeData.id,
        employeeData.uuid,
        employeeData.username,
        '', // Password can be set to an empty string for detail views
        employeeData.is_admin || false, // Ensure `isAdmin` defaults to `false`
        employeeData.firstname, // Map `firstname` to `firstName`
        employeeData.lastname,  // Map `lastname` to `lastName`
        employeeData.sex
      ))
    );
  }

  // Clear user data from both the service and local storage on logout
  logout(): void {
    this.user = new User(0, '', '', '', false, '', '', ''); // Reset user data
    localStorage.removeItem('loggedInUser'); // Clear user from local storage
  }

  // Save user data to local storage
  private saveUserToLocalStorage(user: User): void {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  }

  // Load user data from local storage
  loadUserFromLocalStorage(): User {
    const storedUser = localStorage.getItem('loggedInUser');
    return storedUser ? JSON.parse(storedUser) as User : new User(0, '', '', '', false, '', '', '');
  }
}
