import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMitarbeiterComponent } from './add-mitarbeiter.component';

describe('AddMitarbeiterComponent', () => {
  let component: AddMitarbeiterComponent;
  let fixture: ComponentFixture<AddMitarbeiterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMitarbeiterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMitarbeiterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
