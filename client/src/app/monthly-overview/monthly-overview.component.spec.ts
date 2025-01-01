import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyOverviewComponent } from './monthly-overview.component';

describe('MonthlyOverviewComponent', () => {
  let component: MonthlyOverviewComponent;
  let fixture: ComponentFixture<MonthlyOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
