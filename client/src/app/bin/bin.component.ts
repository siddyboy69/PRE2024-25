import { Component } from '@angular/core';
import { UserService } from '../_service/user.service';
import { NgFor, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-bin',
  standalone: true,
  imports: [NgFor, NgIf, MatIcon],
  templateUrl: './bin.component.html',
  styleUrl: './bin.component.css'
})
export class BinComponent {
  users: any = [];

  constructor(private userService: UserService) {
    this.loadDeletedUsers();
  }

  loadDeletedUsers() {
    this.userService.getDeletedUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err) => {
        console.error("Error fetching deleted users:", err);
      }
    });
  }

  restore(id: number) {
    const confirmRestore = window.confirm("Möchten Sie diesen Benutzer wirklich wiederherstellen?");
    if (confirmRestore) {
      this.userService.restoreUser(id).subscribe({
        next: () => {
          this.users = this.users.filter((user: { id: number; }) => user.id !== id);
          alert("Benutzer wurde erfolgreich wiederhergestellt!");
        },
        error: (err) => {
          console.error("Error restoring user:", err);
          alert("Fehler beim Wiederherstellen des Benutzers.");
        }
      });
    }
  }

  deletePermanently(id: number) {
    const confirmDelete = window.confirm("Sind Sie sicher, dass Sie diesen Benutzer endgültig löschen möchten?");
    if (confirmDelete) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter((user: { id: number; }) => user.id !== id);
          alert("Benutzer wurde dauerhaft gelöscht!");
        },
        error: (err) => {
          console.error("Error deleting user:", err);
          alert("Fehler beim endgültigen Löschen des Benutzers.");
        }
      });
    }
  }

  goBack() {
    window.history.back();
  }

  logout() {
    this.userService.logout();
  }
}
