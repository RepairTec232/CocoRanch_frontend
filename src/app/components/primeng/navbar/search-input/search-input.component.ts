import { Component, Input, signal, effect, OnInit, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppService } from '../../../../services/app.service';
import { ThemeService } from '../../../../services/theme.service';
import { SearchOption } from '../../../../app.interfaces';




@Component({
    selector: 'app-search-input',
    imports: [CommonModule],
    templateUrl: './search-input.component.html',
    styleUrls: ['./search-input.component.scss']
})
export class SearchInputComponent {
  @Input() options = signal<SearchOption[]>([]);
  @Input() type = signal<string | null>(null);

  searchQuery = signal<string>('');
  filteredOptions = signal<SearchOption[]>([]);
  isInputActive = signal<boolean>(false);

  constructor(private router: Router,public appService: AppService, public themeService: ThemeService) {
    effect(
      () => {
        this.filterOptions();
      }
    );
  }
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value || '');
  }

  onFocus() {
    this.isInputActive.set(true);
  }

  onBlur() {
    setTimeout(()=>this.isInputActive.set(false),500);
  }

  getClassIcon(): string {
    if(this.type() == 'white-1' || this.type() == 'blue-1' || this.themeService.isDarkTheme())return 'p-input-icon-left';
    return 'p-input-icon-right';
  }
  getPlaceholder(): string {
    if(this.type() === 'white-1' || this.type() === 'blue-1' || this.themeService.isDarkTheme()) return 'Busca apps, manuales, noticias...'
    return "Buscar..";
  }
  filterOptions(): void {
    const query = this.searchQuery().toLowerCase();
    const currentPath = this.router.url;
    if (!query) {
      this.filteredOptions.set([]);
      return;
    }
    this.filteredOptions.set(
      this.options().filter(option =>
        option.label.toLowerCase().includes(query.toLocaleLowerCase()) && 
        !currentPath.toLocaleLowerCase().includes(option.value.toLocaleLowerCase())
      )
    );
  }

  onOptionSelect(path: String): void {
    this.router.navigate([`/${path}`]);
  }
}
