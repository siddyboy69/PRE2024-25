import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirmenDetailComponent } from './firmen-detail.component';

describe('FirmenDetailComponent', () => {
  let component: FirmenDetailComponent;
  let fixture: ComponentFixture<FirmenDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirmenDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirmenDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
