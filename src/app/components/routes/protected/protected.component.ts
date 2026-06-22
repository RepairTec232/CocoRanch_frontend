import { Component } from '@angular/core';
import { AppService } from '../../../services/app.service';
@Component({
  selector: 'app-protected',
  standalone: true,
  templateUrl: './protected.component.html',
  styleUrl: './protected.component.scss'
})
export class ProtectedComponent {
  constructor(private appService: AppService) {}
 }
