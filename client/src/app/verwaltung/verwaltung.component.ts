import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verwaltung',
  standalone: true,
  templateUrl: './verwaltung.component.html',
  styleUrls: ['./verwaltung.component.css']
})
export class VerwaltungComponent {

  constructor(private router: Router) {}

  goToPersoenlicheDaten(): void {
    this.router.navigate(['/verwaltung/persoenliche-daten']);
  }
  goToFirmen(): void {
    this.router.navigate(['/verwaltung/firmen']);
  }
}
