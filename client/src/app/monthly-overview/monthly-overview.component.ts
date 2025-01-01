import { Component, OnInit } from '@angular/core';
import {ShiftService} from '../../_service/shift.service';
import {UserService} from '../../_service/user.service';
import {MonthlyStats} from '../../_model/monthly-stats';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {CommonModule} from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-monthly-overview',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatNativeDateModule, RouterLink],
  templateUrl: './monthly-overview.component.html',
  styleUrls: ['./monthly-overview.component.css']
})
export class MonthlyOverviewComponent implements OnInit{
  currentStats: MonthlyStats | null = null;
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  isLoading: boolean = false;
  constructor(
    private shiftService: ShiftService,
    protected userService: UserService
  ) {}
  ngOnInit(): void {
    this.loadMonthlyStats();
  }
  loadMonthlyStats(): void {
    this.isLoading = true;
    const userId = this.userService.user.id;

    this.shiftService.getMonthlyStats(userId, this.selectedYear, this.selectedMonth)
      .subscribe({
        next: (stats: MonthlyStats) => {
          if (stats) {
            this.currentStats = stats;
          } else {
            this.currentStats = null;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading monthly stats:', error);
          this.currentStats = null;
          this.isLoading = false;
        }
      });
  }
  changeMonth(offset: number): void {
    let newMonth = this.selectedMonth + offset;
    let newYear = this.selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    this.selectedMonth = newMonth;
    this.selectedYear = newYear;
    this.loadMonthlyStats();
  }
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }
}
