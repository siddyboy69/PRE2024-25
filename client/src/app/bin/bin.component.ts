import { Component } from '@angular/core';
import {UserService} from '../../_service/user.service';

@Component({
  selector: 'app-bin',
  standalone: true,
  imports: [],
  templateUrl: './bin.component.html',
  styleUrl: './bin.component.css'
})
export class BinComponent {
  users:any = [];

  constructor(private userService: UserService) {
    this.userService.getDeletedUsers().subscribe({
      next: (data) => {
        this.users = data;
        console.log(this.users);
      }
    })

  }

  restore(id:number) {
    this.userService.restoreUser(id).subscribe({
      next: (employeeData) => {
        console.log(employeeData);
      }
    })
  }

  deletePermanently(id:number) {
    this.userService.deleteUser(id).subscribe({
      next: (employeeData) => {
        console.log(employeeData);
      }
    })
  }

}
