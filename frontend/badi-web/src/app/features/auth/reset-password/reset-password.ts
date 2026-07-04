import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PasswordModule,
    ButtonModule,
  ],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.errorMessage = 'No se encontró un token de recuperación válido en la URL.';
      }
    });
  }

  onSubmit(): void {
    if (!this.token) {
      this.errorMessage = 'No se encontró un token de recuperación válido.';
      return;
    }

    if (!this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor, completa ambos campos de contraseña.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.password, this.confirmPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.notificationService.success(response.message || 'Contraseña restablecida correctamente.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'El enlace de recuperación no es válido o ha expirado.';
        this.notificationService.error(this.errorMessage);
        this.cdr.detectChanges();
      },
    });
  }
}
