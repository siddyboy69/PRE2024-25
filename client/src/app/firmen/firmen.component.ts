import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterLink } from '@angular/router'
import {FirmenService} from '../_service/firmen.service';
import {Firmen} from '../_model/firmen';

@Component({
  selector: 'app-firmen',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './firmen.component.html',
  styleUrls: ['./firmen.component.css']
})
export class FirmenComponent implements OnInit {
  firmen: Firmen[] = []

  constructor(private firmenService: FirmenService, private router: Router) {}

  ngOnInit(): void {
    this.firmenService.getFirmen().subscribe(data => {
      this.firmen = data
    })
  }

  addFirma(): void {
    this.router.navigate(['/add-firma'])
  }

  goToDetail(id: number): void {
    this.router.navigate(['/firmen-detail', id])
  }
}
