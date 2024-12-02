import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../_service/user.service';
import { MessageService } from '../../_service/message.service'; // Import the MessageService
import { Router } from '@angular/router'; // Import Router to navigate after deletion
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

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private msg: MessageService, // Inject MessageService here
    private router: Router // Inject Router for navigation
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUserById(id).subscribe({
      next: (employee) => {
        console.log("Employee data fetched:", employee);
        this.employee = {
          id: employee.id,  // Add the id here
          username: employee.username,
          firstname: employee.firstName,
          lastname: employee.lastName,
          sex: employee.sex
        };
      },
      error: (err) => console.error('Error fetching employee:', err)
    });
  }

  deleteEmployee(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.userService.deleteUser(id).subscribe({
        next: (response) => {
          console.log('Employee deleted:', response);
          this.msg.addMessage('Employee deleted successfully');
          // Use navigateByUrl for more reliable navigation
          this.router.navigateByUrl('/homepage');
        },
        error: (err) => {
          console.error('Error deleting employee:', err);
          this.msg.addMessage('Error deleting employee');
        }
      });
    } else {
      console.error('No employee ID found');
      this.msg.addMessage('No employee ID found');
    }
  }
}
