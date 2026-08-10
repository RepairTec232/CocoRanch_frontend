import { Inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme = signal<HTMLLinkElement | null>(null);
  public isDarkTheme = signal<boolean>(false);
  public darkThemeUrl = 'assets/css/dark-theme.css';
  public defaultThemeUrl = 'assets/css/default-theme.css';

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isDarkTheme.set(localStorage.getItem("theme") === "dark");
      this.setTheme(this.isDarkTheme() ? this.darkThemeUrl : this.defaultThemeUrl);
    }
  }

  public toggleTheme(): void {
    const isDark = this.isDarkTheme();
    this.isDarkTheme.set(!isDark);
    localStorage.setItem("theme", !isDark ? "dark" : "light");
    this.setTheme(!isDark ? this.darkThemeUrl : this.defaultThemeUrl);
  }

  private setTheme(themeUrl: string): void {
    if (this.currentTheme()) {
      this.renderer.removeChild(document.head, this.currentTheme());
    }

    const linkElement = this.renderer.createElement('link');
    linkElement.setAttribute('rel', 'stylesheet');
    linkElement.setAttribute('href', themeUrl);
    this.renderer.appendChild(document.head, linkElement);
    this.currentTheme.set(linkElement);
  }
}



