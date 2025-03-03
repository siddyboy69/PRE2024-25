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
  user: User;
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private msg: MessageService) {
    // Initialize with a default user
    this.user = new User(0, '', '', '', false, '', '', '', false);
    // Try to load from localStorage
    const storedUser = this.loadUserFromLocalStorage();
    if (storedUser.id !== 0) {
      this.user = storedUser;
    }
  }


  isLoggedIn(): boolean {
    return this.user && this.user.id !== 0 && localStorage.getItem('auth_token') !== null;
  }


  isAdmin(): boolean {
    return Boolean(this.user && this.user.isAdmin);
  }


  // In UserService login method
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/login`, { username, password }).pipe(
      tap(response => {
        console.log('Login response:', response);
        this.msg.addMessage('Login successful');
        // Fix property name mapping
        this.user = new User(
          response.user.id,
          response.user.uuid,
          response.user.username,
          response.user.password,
          response.user.isAdmin === 1 || response.user.isAdmin === true, // Handle both cases
          response.user.firstName, // Changed from firstname to firstName
          response.user.lastName,  // Changed from lastname to lastName
          response.user.sex,
          response.user.deleted
        );
        console.log('Created user object:', this.user);
        this.saveUserToLocalStorage(this.user);
        localStorage.setItem('auth_token', response.token);
      }),
      catchError(_ => {
        this.msg.addMessage('Login failed');
        return of(null);
      })
    );
  }


  register(username: string, password: string, email: string, firstname: string, lastname: string, sex: string, address: string, postalcode: string, city: string, country: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/register`, {
      username, password, firstname, lastname, sex, email, address, postalcode, city, country
    }).pipe(
      tap(res => this.msg.addMessage('Register successful')),
      catchError(_ => {
        this.msg.addMessage('Register failed');
        return of(new User(0, '', '', '', false, '', '', '', false));
      })
    );
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getAuthHeaders() }).pipe(
      tap(users => console.log('Raw users data:', users)), // Debug log
      map(users => users.map((user: any) => ({
        id: user.id,
        firstname: user.firstName || user.firstname, // Handle both cases
        lastname: user.lastName || user.lastname,    // Handle both cases
        isAdmin: user.is_admin === 1 || user.is_admin === true
      }))),
      tap(mappedUsers => console.log('Mapped users:', mappedUsers)), // Debug log
      catchError(err => {
        if (err.status === 401) {
          this.logout();
          this.msg.addMessage('Session expired. Please log in again.');
        }
        return of([]);
      })
    );
  }

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
        employeeData.sex,
        employeeData.deleted
      )),
      catchError(err => {
        if (err.status === 401) {
          this.logout();
          this.msg.addMessage('Session expired. Please log in again.');
        }
        return of(new User(0, '', '', '', false, '', '', '', false));
      })
    );
  }

  /** Update user details (NEW) */
  updateUser(id: number, updatedData: Partial<User>): Observable<User> {
    const data = {
      id: id,
      username: updatedData.username,
      firstname: updatedData.firstname,
      lastname: updatedData.lastname,
      sex: updatedData.sex
    };

    console.log('Sending update data:', data);

    return this.http.put<User>(`${this.apiUrl}/users/update`, data, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => {
          console.log('Update response:', response);
          this.msg.addMessage('User updated successfully');
        }),
        catchError(err => {
          this.msg.addMessage('Failed to update user');
          console.error('Error updating user:', err);
          return of(new User(0, '', '', '', false, '', '', '', false));
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
    this.user = new User(0, '', '', '', false, '', '', '', false);
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('auth_token');
    this.msg.addMessage('Logout successful');
    window.location.href = '/';
  }

  /** Save user to local storage */
  private saveUserToLocalStorage(user: User): void {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
  }

  public loadUserFromLocalStorage(): User {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      return new User(
        userData.id,
        userData.uuid,
        userData.username,
        userData.password,
        Boolean(userData.isAdmin), // Ensure boolean conversion
        userData.firstname,
        userData.lastname,
        userData.sex,
        userData.deleted
      );
    }
    return new User(0, '', '', '', false, '', '', '', false);
  }

  /** Helper to generate authorization headers */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  /** bin **/
  getDeletedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/soft-delete`, { headers: this.getAuthHeaders() });
  }

  softDeleteUser(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/soft-delete/${id}`, {}, { headers: this.getAuthHeaders() });
  }

  restoreUser(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/restore/${id}`, {}, { headers: this.getAuthHeaders() });
  }

}
