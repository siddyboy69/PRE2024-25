import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import {FirmenService} from '../_service/firmen.service';

@Component({
  selector: 'app-add-firma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-firma.component.html',
  styleUrls: ['./add-firma.component.css']
})
export class AddFirmaComponent {
  bezeichnung = ''

  constructor(private firmenService: FirmenService, private router: Router) {}

  cancel(): void {
    this.router.navigate(['/firmen'])
  }

  save(): void {
    this.firmenService.createFirma(this.bezeichnung).subscribe(() => {
      this.router.navigate(['/firmen'])
    })
  }
}
