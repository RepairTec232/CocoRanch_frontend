import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
    selector: 'app-progress-bar',
    imports: [CommonModule, ProgressBarModule],
    templateUrl: './progress-bar.component.html',
    styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent {
  @Input() show: boolean = false;
}
