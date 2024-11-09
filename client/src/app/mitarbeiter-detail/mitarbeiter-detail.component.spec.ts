import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitarbeiterDetailComponent } from './mitarbeiter-detail.component';

describe('MitarbeiterDetailComponent', () => {
  let component: MitarbeiterDetailComponent;
  let fixture: ComponentFixture<MitarbeiterDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MitarbeiterDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MitarbeiterDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
