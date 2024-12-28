import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyTimesheetComponent } from './monthly-timesheet.component';

describe('MonthlyTimesheetComponent', () => {
  let component: MonthlyTimesheetComponent;
  let fixture: ComponentFixture<MonthlyTimesheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyTimesheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
