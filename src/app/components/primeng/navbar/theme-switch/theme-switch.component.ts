import { Component } from '@angular/core';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../../services/theme.service';
@Component({
    selector: 'app-theme-switch',
    imports: [InputSwitchModule, CommonModule, FormsModule],
    templateUrl: "./theme-switch.component.html",
    styleUrls: ['./theme-switch.component.scss']
})
export class ThemeSwitchComponent {
  constructor(
    public themeService: ThemeService
  ) { }
}