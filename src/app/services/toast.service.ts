import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'error' | 'info';
}

/** Avisos efímeros en cristal, anclados sobre la barra de navegación. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private id = 0;
  readonly toasts = signal<Toast[]>([]);

  show(text: string, kind: Toast['kind'] = 'info', ms = 2800): void {
    const toast: Toast = { id: ++this.id, text, kind };
    this.toasts.update((t) => [...t, toast]);
    setTimeout(() => this.dismiss(toast.id), ms);
  }

  ok(text: string): void { this.show(text, 'ok'); }
  error(e: unknown): void { this.show(e instanceof Error ? e.message : String(e), 'error', 4000); }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
