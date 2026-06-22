import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { UsersService, User } from '../users.service';
import { RolesService, Role } from '../../roles/roles.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
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
      password: ['']
    });

    if (this.mode === 'create') {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    } else if (this.mode === 'edit' && this.user) {
      this.form.patchValue({
        nombres: this.user.nombres,
        apellidos: this.user.apellidos,
        email: this.user.email,
        roles: this.user.roles ? this.user.roles.map(r => r.id) : []
      });
    }
  }

  ngOnInit(): void {
    this.rolesService.getAllActive().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: (err) => {
        console.error('Error loading roles', err);
        this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const val = this.form.value;

    const dto: any = {
      nombres: val.nombres,
      apellidos: val.apellidos,
      email: val.email,
      roleIds: val.roles
    };

    if (val.password) {
      dto.password = val.password;
    }

    if (this.mode === 'create') {
      this.usersService.create(dto)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.snackBar.open('Usuario creado exitosamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al crear el usuario', 'Cerrar', { duration: 3000 });
          }
        });
    } else {
      this.usersService.update(this.user!.id, dto)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al actualizar el usuario', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }
}
