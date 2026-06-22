import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, UserProfile } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile-detail.html',
  styleUrl: './profile-detail.scss'
})
export class ProfileDetailComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loadingProfile = false;
  loadingPassword = false;
  userProfile?: UserProfile;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profileForm.patchValue({
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          email: profile.email
        });
      },
      error: () => {
        this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 3000 });
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSaveProfile() {
    if (this.profileForm.invalid) return;
    this.loadingProfile = true;
    
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.loadingProfile = false;
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al actualizar perfil';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        this.loadingProfile = false;
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.loadingPassword = true;

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.snackBar.open('Contraseña actualizada correctamente', 'Cerrar', { duration: 3000 });
        this.passwordForm.reset();
        this.loadingPassword = false;
        
        // Refresh profile if it had requiereCambioPassword
        if (this.userProfile?.requiereCambioPassword) {
          this.loadProfile();
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al cambiar contraseña';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        this.loadingPassword = false;
      }
    });
  }
}
