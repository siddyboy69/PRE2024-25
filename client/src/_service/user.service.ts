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

  /** Check if user is logged in */
  isLoggedIn(): boolean {
    return this.user && this.user.id !== 0 && localStorage.getItem('auth_token') !== null;
  }

  /** Check if user has admin privileges */
  isAdmin(): boolean {
    return this.user && this.user.isAdmin;
  }

  /** User login */
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/login`, { username, password }).pipe(
      tap(response => {
        this.msg.addMessage('Login successful');
        this.user = response.user;
        this.saveUserToLocalStorage(this.user);
        localStorage.setItem('auth_token', response.token);
      }),
      catchError(_ => {
        this.msg.addMessage('Login failed');
        return of(null);
      })
    );
  }

  /** Register a new user */
  register(username: string, password: string, email: string, firstName: string, lastName: string, sex: string, address: string, postalcode: string, city: string, country: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/register`, {
      username, password, firstname: firstName, lastname: lastName,
      sex, email, address, postalcode, city, country
    }).pipe(
      tap(res => this.msg.addMessage('Register successful')),
      catchError(_ => {
        this.msg.addMessage('Register failed');
        return of(new User(0, '', '', '', false, '', '', ''));
      })
    );
  }

  /** Fetch all users */
  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getAuthHeaders() }).pipe(
      tap(res => console.log('Users fetched:', res)),
      catchError(err => {
        if (err.status === 401) {
          this.logout();
          this.msg.addMessage('Session expired. Please log in again.');
        }
        return of([]);
      })
    );
  }

  /** Fetch user details by ID */
  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(employeeData => new User(
        employeeData.id,
        employeeData.uuid,
        employeeData.username,
        '', // Password not needed
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
        return of(new User(0, '', '', '', false, '', '', ''));
      })
    );
  }

  /** Update user details (NEW) */
  updateUser(id: number, updatedData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/update/${id}`, updatedData, { headers: this.getAuthHeaders() }).pipe(
      tap(_ => this.msg.addMessage('User updated successfully')),
      catchError(err => {
        this.msg.addMessage('Failed to update user');
        console.error('Error updating user:', err);
        return of(new User(0, '', '', '', false, '', '', ''));
      })
    );
  }

  /** Delete a user */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/delete/${id}`, { headers: this.getAuthHeaders() }).pipe(
      tap(_ => this.msg.addMessage('User deleted successfully')),
      catchError(err => {
        this.msg.addMessage('Error deleting user');
        console.error('Error deleting user:', err);
        return of(null);
      })
    );
  }

  /** User logout */
  logout(): void {
    this.user = new User(0, '', '', '', false, '', '', '');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('auth_token');
    this.msg.addMessage('Logout successful');
    window.location.href = '/';
  }

  /** Save user to local storage */
  private saveUserToLocalStorage(user: User): void {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  }

  /** Load user from local storage */
  public loadUserFromLocalStorage(): User {
    const storedUser = localStorage.getItem('loggedInUser');
    return storedUser ? JSON.parse(storedUser) as User : new User(0, '', '', '', false, '', '', '');
  }

  /** Helper to generate authorization headers */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
}
