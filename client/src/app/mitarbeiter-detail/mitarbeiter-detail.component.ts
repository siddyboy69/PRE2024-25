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
      next: (employee) => {
        this.employee = { ...employee }; // Clone the employee data
      },
      error: (err) => console.error('Error fetching employee:', err)
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    this.userService.updateUser(this.employee.id, this.employee).subscribe({
      next: () => {
        this.msg.addMessage('Mitarbeiter erfolgreich aktualisiert');
        this.isEditing = false; // Exit edit mode
      },
      error: (err: any) => {
        console.error('Error updating employee:', err);
        this.msg.addMessage('Fehler beim Aktualisieren des Mitarbeiters');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/homepage']);
  }
}
