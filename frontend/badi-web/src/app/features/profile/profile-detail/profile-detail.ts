import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FluidModule } from 'primeng/fluid';
import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

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
    MatProgressSpinnerModule,
    RouterModule,
    IftaLabelModule,
    InputTextModule,
    ButtonModule,
    FluidModule
  ],
  templateUrl: './profile-detail.html',
  styleUrl: './profile-detail.scss'
})
export class ProfileDetailComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  loadingProfile = false;
  loadingPassword = false;
  error: string | null = null;
  userProfile?: UserProfile;

  private routerSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
    // Usar el usuario cacheado inmediatamente para pintar rápido sin depender de datos nulos
    const cachedUser = this.authService.getCurrentUser();
    if (cachedUser) {
      this.userProfile = {
        id: cachedUser.id,
        nombres: cachedUser.nombres,
        apellidos: cachedUser.apellidos,
        email: cachedUser.email,
        cedula: null,
        telefono: null,
        roles: cachedUser.roles || [],
        requiereCambioPassword: cachedUser.requiereCambioPassword,
        estado: 'Activo'
      };
      this.profileForm.patchValue({
        nombres: cachedUser.nombres,
        apellidos: cachedUser.apellidos,
        email: cachedUser.email
      });
      this.loading = false;
      this.cdr.detectChanges();
    }

    this.loadProfile();

    // Suscribirse a los eventos de navegación para recargar si el usuario vuelve a entrar
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url === '/profile' || event.urlAfterRedirects === '/profile') {
        this.loadProfile();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadProfile() {
    if (!this.userProfile) {
      this.loading = true;
    }
    this.error = null;
    this.cdr.detectChanges();

    this.authService.getProfile().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profileForm.patchValue({
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          email: profile.email
        });
        this.cdr.detectChanges();
      },
      error: () => {
        if (!this.userProfile) {
          this.error = 'No se pudo cargar la información del perfil. Verifica tu conexión al servidor.';
        }
        this.notificationService.error('Error al cargar la información del perfil');
        this.cdr.detectChanges();
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
    this.cdr.detectChanges();
    
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.notificationService.success('Perfil actualizado correctamente');
        this.loadingProfile = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al actualizar perfil';
        this.notificationService.error(msg);
        this.loadingProfile = false;
        this.cdr.detectChanges();
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.loadingPassword = true;
    this.cdr.detectChanges();

    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.notificationService.success('Contraseña actualizada correctamente');
        this.passwordForm.reset();
        this.loadingPassword = false;
        this.cdr.detectChanges();
        
        // Refresh profile if it had requiereCambioPassword
        if (this.userProfile?.requiereCambioPassword) {
          this.loadProfile();
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al cambiar contraseña';
        this.notificationService.error(msg);
        this.loadingPassword = false;
        this.cdr.detectChanges();
      }
    });
  }
}

