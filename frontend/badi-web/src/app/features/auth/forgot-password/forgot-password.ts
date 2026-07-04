import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputTextModule,
    ButtonModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  onSubmit(): void {
    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'Por favor, ingresa tu correo electrónico.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Si el correo está registrado, se enviará un enlace de recuperación.';
        this.notificationService.success(this.successMessage);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.successMessage = 'Si el correo está registrado, se enviará un enlace de recuperación.';
        this.notificationService.success(this.successMessage);
        this.cdr.detectChanges();
      },
    });
  }
}
