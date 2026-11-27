import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  correo = '';
  password = '';
  errorMsg = '';
  cargando = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  autocompletar(correo: string) {
    this.errorMsg = '';
    this.correo = correo;
    this.password = '123456';
    this.cdr.detectChanges();
  }

  onLogin() {
    this.errorMsg = '';
    this.cargando = true;
    this.cdr.detectChanges();

    this.api.login(this.correo, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMsg = err.error?.error || 'Usuario o contraseña incorrectos.';
        this.cdr.detectChanges();
      }
    });
  }
}