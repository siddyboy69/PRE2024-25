import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../_service/user.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {
employees:any [] = [];
constructor(
private userService:UserService,
private router: Router
) {}

  fetchEmployee():void{
  this.userService.getUsers().subscribe({
    next: (obj: any) => {
      this.employees = obj.docs;
    },
    error: err => console.error(err)
  })
  }
}
