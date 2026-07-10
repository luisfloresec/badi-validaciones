import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { UsersService, User } from '../users.service';
import { RolesService, Role } from '../../roles/roles.service';
import { passwordStrongValidator, STRONG_PASSWORD_MESSAGE } from '../../../shared/validators/password-strong.validator';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    InputTextModule,
    ButtonModule,
    IftaLabelModule
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  mode: 'create' | 'edit';
  user?: User;
  availableRoles: Role[] = [];
  rolesLoaded = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private rolesService: RolesService,
    private dialogRef: MatDialogRef<UserFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit', user?: User }
  ) {
    this.mode = data.mode;
    this.user = data.user;

    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roles: [[], Validators.required],
      estado: ['Activo', Validators.required],
      requiereCambioPassword: [true],
      password: ['']
    });

    if (this.mode === 'create') {
      // Crear: contraseña obligatoria y fuerte, correo @badiec.org
      this.form.get('password')?.setValidators([Validators.required, passwordStrongValidator]);
      this.form.get('email')?.addValidators([Validators.pattern(/^[a-zA-Z0-9._%+-]+@badiec\.org$/)]);
      this.form.get('email')?.updateValueAndValidity();
    } else if (this.mode === 'edit' && this.user) {
      // Editar: si se escribe contraseña debe ser fuerte; si está vacía se ignora
      this.form.get('password')?.setValidators([passwordStrongValidator]);
      this.form.patchValue({
        nombres: this.user.nombres,
        apellidos: this.user.apellidos,
        email: this.user.email,
        estado: this.user.estado || 'Activo',
        requiereCambioPassword: this.user.requiereCambioPassword !== undefined ? this.user.requiereCambioPassword : false,
        roles: this.user.roles ? this.user.roles.map(r => r.id) : []
      });
    }
  }

  /** Exponer mensaje para el template */
  readonly passwordHint = STRONG_PASSWORD_MESSAGE;

  ngOnInit(): void {
    this.rolesService.getAllActive().subscribe({
      next: (roles) => {
        setTimeout(() => {
          this.availableRoles = roles;
          this.rolesLoaded = true;
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.availableRoles = [];
          this.rolesLoaded = true;
        }, 0);
        console.error('Error loading roles', err);
        this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const val = this.form.value;

    const dto: any = {
      nombres: val.nombres,
      apellidos: val.apellidos,
      email: val.email,
      estado: val.estado,
      requiereCambioPassword: val.requiereCambioPassword,
      roleIds: val.roles
    };

    if (val.password && this.mode === 'create') {
      dto.password = val.password;
    }

    if (this.mode === 'create') {
      this.usersService.create(dto)
        .subscribe({
          next: () => {
            this.snackBar.open('Usuario creado exitosamente', 'Cerrar', { duration: 3000 });
            setTimeout(() => {
              this.dialogRef.close(true);
            }, 0);
          },
          error: (err) => {
            this.loading = false;
            this.snackBar.open(err.error?.message || 'Error al crear el usuario', 'Cerrar', { duration: 3000 });
          }
        });
    } else {
      this.usersService.update(this.user!.id, dto)
        .subscribe({
          next: () => {
            this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
            setTimeout(() => {
              this.dialogRef.close(true);
            }, 0);
          },
          error: (err) => {
            this.loading = false;
            this.snackBar.open(err.error?.message || 'Error al actualizar el usuario', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }
}
