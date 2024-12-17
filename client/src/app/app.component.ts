import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from '../_service/user.service';
import {NavbarComponent} from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'client';
  constructor(private userService: UserService) {}

  ngOnInit() {
    // Reload user session if any on application start
    this.userService.user = this.userService.loadUserFromLocalStorage();

    // Optional: Clear cached login data if service workers are used
    // This can be removed if it’s interfering with navigation
    /*
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHED_DATA' });
    }
    */
  }
}
