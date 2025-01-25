// src/app/persoenliche-daten/persoenliche-daten.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService} from '../../_service/user.service';

@Component({
  selector: 'app-persoenliche-daten',
  standalone: true,
  templateUrl: './persoenliche-daten.component.html',
  styleUrls: ['./persoenliche-daten.component.css']
})
export class PersoenlicheDatenComponent implements OnInit {
  userFirstName = '';
  userLastName = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userFirstName = this.userService.user.firstname;
    this.userLastName = this.userService.user.lastname;
  }
}
