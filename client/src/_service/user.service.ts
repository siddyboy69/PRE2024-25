import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../_model/user';
import { MessageService } from './message.service';

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

  register(username: string, password: string, email: string, firstname: string, lastname: string, sex: string, address: string, postalcode: string, city: string, country: string): Observable<User> {
    return this.http.post<User>('http://localhost:3000/users/register', {
      username: username,
      password: password,
      email: email,
      firstname: firstname,
      lastname: lastname,
      sex: sex,
      address: address,
      postalcode: postalcode,
      city: city,
      country: country
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
    return this.http.get<any>('http://localhost:3000/users');
  }

}

