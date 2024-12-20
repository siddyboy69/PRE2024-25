import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../_service/user.service';
import { MessageService } from '../../_service/message.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mitarbeiter-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mitarbeiter-detail.component.html',
  styleUrls: ['./mitarbeiter-detail.component.css']
})
export class MitarbeiterDetailComponent implements OnInit {
  employee: any = null;
  isEditing: boolean = false; // Toggle edit mode

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private msg: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.userService.getUserById(id).subscribe({
      next: (employeeData) => {
        this.employee = {
          id: id,  // Explicitly set the ID
          username: employeeData.username,
          firstname: employeeData.firstname,
          lastname: employeeData.lastname,
          sex: employeeData.sex
        };
      },
      error: (err) => console.error('Error fetching employee:', err)
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    if (!this.employee || !this.employee.id) {
      console.error('No employee ID available');
      return;
    }

    // Only include fields that were actually changed
    const updatedData: any = {
      id: this.employee.id
    };

    if (this.employee.username) updatedData.username = this.employee.username;
    if (this.employee.firstname) updatedData.firstname = this.employee.firstname;
    if (this.employee.lastname) updatedData.lastname = this.employee.lastname;
    if (this.employee.sex) updatedData.sex = this.employee.sex;

    this.userService.updateUser(this.employee.id, updatedData).subscribe({
      next: (response) => {
        if (response) {
          this.employee = {
            ...this.employee,
            ...response
          };
          this.msg.addMessage('Mitarbeiter erfolgreich aktualisiert');
          this.isEditing = false;
        } else {
          console.error('Invalid response from server:', response);
          this.msg.addMessage('Fehler beim Aktualisieren des Mitarbeiters');
        }
      },
      error: (err) => {
        console.error('Error updating employee:', err);
        this.msg.addMessage('Fehler beim Aktualisieren des Mitarbeiters');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/homepage']);
  }
}
