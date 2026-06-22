import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';
import { RolesService, Role } from '../roles.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './role-form.html',
  styleUrl: './role-form.scss'
})
export class RoleFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  mode: 'create' | 'edit';
  role?: Role;

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private dialogRef: MatDialogRef<RoleFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit', role?: Role }
  ) {
    this.mode = data.mode;
    this.role = data.role;

    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      perfilAcceso: ['', Validators.required]
    });

    if (this.mode === 'edit' && this.role) {
      this.form.patchValue({
        nombre: this.role.nombre,
        descripcion: this.role.descripcion,
        perfilAcceso: this.role.perfilAcceso
      });
      
      const officialRoles = ['Administrador', 'Gestión Social', 'Auditor'];
      if (officialRoles.includes(this.role.nombre)) {
        this.form.get('nombre')?.disable();
      }
    }
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const val = this.form.getRawValue();

    const dto = {
      nombre: val.nombre,
      descripcion: val.descripcion,
      perfilAcceso: val.perfilAcceso
    };

    if (this.mode === 'create') {
      this.rolesService.create(dto)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.snackBar.open('Rol creado exitosamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al crear el rol', 'Cerrar', { duration: 3000 });
          }
        });
    } else {
      this.rolesService.update(this.role!.id, dto)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.snackBar.open('Rol actualizado exitosamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al actualizar el rol', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }
}
