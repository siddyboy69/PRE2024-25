import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFirmaComponent } from './add-firma.component';

describe('AddFirmaComponent', () => {
  let component: AddFirmaComponent;
  let fixture: ComponentFixture<AddFirmaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFirmaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFirmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
