import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../_model/user';
import { MessageService } from './message.service';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User = new User(0, '', '', '', false, '', '', '');
  constructor(private http: HttpClient, private msg: MessageService) { }

  isLoggedIn(): boolean {
    return this.user.id !== 0;
  }

  isAdmin(): boolean {
    return this.user.isAdmin;
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<User>('http://localhost:3000/users/login', {
      username: username,
      password: password
    }).pipe(
      tap(res => {
        this.msg.addMessage('Login successful');
        this.user = res;
      }),
      catchError(_ => {
        this.msg.addMessage('Login failed');
        return of();
      })
    );
  }
  register(username: string, password: string, email: string, firstName: string, lastName: string, sex: string, address: string, postalcode: string, city: string, country: string): Observable<User> {
    return this.http.post<User>('http://localhost:3000/users/register', {
      username: username,
      password: password,
      firstname: firstName,  // Ensure correct field name
      lastname: lastName,    // Ensure correct field name
      sex: sex
    }).pipe(
      tap(res => {
        this.msg.addMessage('Register successful');
        this.user = res;
      }),
      catchError(_ => {
        this.msg.addMessage('Register failed');
        return of();
      })
    );
  }

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
}
