import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-svg',
    imports: [],
    templateUrl: './svg.component.html',
    styleUrls: ['./svg.component.scss']
})
export class SvgComponent implements OnInit, AfterViewInit {
  @Input() path!: string;
  @Input() fillColor: string = 'currentColor';
  svgContent: SafeHtml = '';

  // Lista blanca de rutas permitidas
  private readonly allowedPaths = [
    'assets/icons/',
    'http://localhost:4200',
    'https://coppel-trusted-domain.com/svg/'
  ];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (this.isPathValid()) {
      this.loadSvg();
    } else {
      console.error('Ruta de SVG no permitida:', this.path);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.applyFillColor();
    }, 0);
  }

  private isPathValid(): boolean {
    return this.allowedPaths.some(allowedPath => 
      this.path.startsWith(allowedPath)
    );
  }

  private loadSvg(): void {
    this.http.get(this.path, { responseType: 'text' }).subscribe({
      next: (data: string) => {
        let sanitizedData = data;
        
        // Ejecutar DOMPurify solo en el cliente
        if (isPlatformBrowser(this.platformId)) {
          sanitizedData = DOMPurify.sanitize(data, {
            USE_PROFILES: { svg: true },
            ADD_TAGS: ['use']
          });
        }

        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(sanitizedData);
        setTimeout(() => this.applyFillColor(), 0);
      },
      error: (err) => console.error('Error al cargar SVG:', err)
    });
  }

  applyFillColor(): void {
    const svgElement = this.elementRef.nativeElement.querySelector('div svg');
    if (svgElement) {
      this.setFillRecursively(svgElement, this.fillColor);
    }
  }

  setFillRecursively(element: Element, fillColor: string): void {
    // Sobrescribir cualquier valor de fill, sin importar su valor inicial.
    element.setAttribute('fill', fillColor);

    // Eliminar estilos inline que puedan interferir.
    element.removeAttribute('style');

    // Aplicar el color a todos los elementos hijos.
    Array.from(element.children).forEach((child) => {
      this.setFillRecursively(child, fillColor);
    });
  }
}
