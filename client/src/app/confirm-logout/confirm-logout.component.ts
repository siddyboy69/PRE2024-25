import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-logout',
  standalone: true,
  imports: [],
  templateUrl: './confirm-logout.component.html',
  styleUrl: './confirm-logout.component.css'
})
export class ConfirmLogoutComponent {
  @Input() firstName: string = '';
  @Input() lastName: string = '';
  @Output() onLogoutConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  confirmLogout() {
    this.onLogoutConfirm.emit();
  }

  cancel() {
    this.onCancel.emit();
  }
}
