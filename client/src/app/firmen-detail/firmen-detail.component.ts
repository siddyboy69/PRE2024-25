import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute } from '@angular/router'
import {FirmenService} from '../../_service/firmen.service';
import {Firmen} from '../../_model/firmen';

@Component({
  selector: 'app-firmen-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './firmen-detail.component.html',
  styleUrls: ['./firmen-detail.component.css']
})
export class FirmenDetailComponent implements OnInit {
  firma: Firmen | null = null

  constructor(private route: ActivatedRoute, private firmenService: FirmenService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'))
    if (id) {
      this.firmenService.getFirma(id).subscribe(data => {
        this.firma = data
      })
    }
  }
}
