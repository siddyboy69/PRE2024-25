import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirmenComponent } from './firmen.component';

describe('FirmenComponent', () => {
  let component: FirmenComponent;
  let fixture: ComponentFixture<FirmenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirmenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirmenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
