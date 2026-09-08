import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Hoja modal de cristal que sube desde abajo (patrón bottom-sheet móvil).
 * El contenido se proyecta; el cierre siempre lo decide el componente padre.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="close.emit()"></div>
    <section class="sheet" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="head">
        <span class="grabber"></span>
        <div class="row">
          <h2>{{ title() }}</h2>
          <button class="x" type="button" (click)="close.emit()" aria-label="Cerrar">✕</button>
        </div>
        @if (subtitle()) {
          <p class="dim">{{ subtitle() }}</p>
        }
      </header>
      <div class="body"><ng-content /></div>
      <footer class="foot"><ng-content select="[modal-footer]" /></footer>
    </section>
  `,
  styleUrl: './modal.scss',
})
export class Modal {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly close = output<void>();
}
