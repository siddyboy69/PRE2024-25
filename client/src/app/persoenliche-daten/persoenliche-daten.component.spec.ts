import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersoenlicheDatenComponent } from './persoenliche-daten.component';

describe('PersoenlicheDatenComponent', () => {
  let component: PersoenlicheDatenComponent;
  let fixture: ComponentFixture<PersoenlicheDatenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersoenlicheDatenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersoenlicheDatenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
