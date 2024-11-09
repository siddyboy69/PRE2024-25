import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../_service/user.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-mitarbeiter-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mitarbeiter-detail.component.html',
  styleUrl: './mitarbeiter-detail.component.css'
})
export class MitarbeiterDetailComponent implements OnInit  {
  employee: any = null;

  constructor(private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUserById(id).subscribe({
      next: (employee) => {
        console.log("Employee data fetched:", employee); // Add this line
        this.employee = {
          username: employee.username,
          firstname: employee.firstName,
          lastname: employee.lastName,
          sex: employee.sex
        };
      },
      error: (err) => console.error('Error fetching employee:', err)
    });
  }
}
