import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftService } from '../../_service/shift.service';
import { UserService } from '../../_service/user.service';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
interface DayRecord {
  date: string;
  day: string;
  total: string;
  dayNotes?: string;
}

@Component({
  selector: 'app-monthly-timesheet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule],
  templateUrl: './monthly-timesheet.component.html',
  styleUrls: ['./monthly-timesheet.component.css']
})
export class MonthlyTimesheetComponent implements OnInit {
  currentDate: Date = new Date();
  currentMonth: string = '';
  records: DayRecord[] = [];
  totalHours: string = '00:00';
  totalDays: number = 0;
  averageHours: string = '00:00';

  constructor(
    private shiftService: ShiftService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.updateMonthDisplay();
    this.loadMonthlyData();
  }
  changeMonth(direction: number): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + direction,
      1
    );
    this.updateMonthDisplay();
    this.loadMonthlyData();
  }
  private updateMonthDisplay(): void {
    this.currentMonth = this.currentDate.toLocaleString('de-DE', {
      month: 'long',
      year: 'numeric'
    });
  }
  loadMonthlyData() {
    const userId = this.userService.user.id;
    this.shiftService.getMonthlyShifts(
      userId,
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1
    ).subscribe({
      next: (data) => {
        this.records = data;
        this.calculateTotals();
      },
      error: (error) => {
        console.error('Error loading monthly data:', error);
      }
    });
  }

  calculateTotals() {
    this.totalDays = this.records.length;

    // Calculate total hours
    let totalMinutes = 0;
    this.records.forEach(record => {
      const [hours, minutes] = record.total.split(':').map(Number);
      totalMinutes += (hours * 60) + minutes;
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    this.totalHours = `${totalHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;


    if (this.totalDays > 0) {
      const avgMinutes = Math.round(totalMinutes / this.totalDays);
      const avgHours = Math.floor(avgMinutes / 60);
      const avgRemainingMinutes = avgMinutes % 60;
      this.averageHours = `${avgHours.toString().padStart(2, '0')}:${avgRemainingMinutes.toString().padStart(2, '0')}`;
    }
  }
}
