import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { Login } from './login';

describe('Login', () => {
  it('monta y, con el alta desactivada, no ofrece crear cuenta', async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    const html: string = fixture.nativeElement.textContent;
    expect(html).toContain('Entrar');
    expect(html).toContain('El registro está cerrado');
    // environment.allowSignup === false: el formulario de alta no debe aparecer.
    expect(html).not.toContain('Crear cuenta');
  });
});
