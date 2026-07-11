import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { finalize } from 'rxjs/operators';
import { RolesService, Role } from '../roles.service';
import { UppercaseDirective } from '../../../shared/directives/uppercase.directive';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    IftaLabelModule,
    UppercaseDirective
  ],
  templateUrl: './role-form.html',
  styleUrl: './role-form.scss'
})
export class RoleFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  mode: 'create' | 'edit' | 'detail';
  role?: Role;

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private dialogRef: MatDialogRef<RoleFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit' | 'detail', role?: Role }
  ) {
    this.mode = data.mode;
    this.role = data.role;

    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      perfilAcceso: ['Administrador', Validators.required]
    });

    if ((this.mode === 'edit' || this.mode === 'detail') && this.role) {
      this.form.patchValue({
        nombre: this.role.nombre,
        descripcion: this.role.descripcion,
        perfilAcceso: this.role.perfilAcceso || 'Administrador'
      });
      
      const officialRoles = ['Administrador', 'Gestión Social', 'Auditor'];
      if (officialRoles.includes(this.role.nombre) || this.mode === 'detail') {
        this.form.get('nombre')?.disable();
      }
      if (this.mode === 'detail') {
        this.form.disable();
      }
    }
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.mode === 'detail') {
      this.dialogRef.close();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const val = this.form.getRawValue();

    const dto = {
      nombre: val.nombre,
      descripcion: val.descripcion,
      perfilAcceso: val.perfilAcceso
    };

    if (this.mode === 'create') {
      this.rolesService.create(dto)
        .subscribe({
          next: () => {
            this.snackBar.open('Rol creado exitosamente', 'Cerrar', { duration: 3000 });
            setTimeout(() => {
              this.dialogRef.close(true);
            }, 0);
          },
          error: (err) => {
            this.loading = false;
            this.snackBar.open(err.error?.message || 'Error al crear el rol', 'Cerrar', { duration: 3000 });
          }
        });
    } else {
      this.rolesService.update(this.role!.id, dto)
        .subscribe({
          next: () => {
            this.snackBar.open('Rol actualizado exitosamente', 'Cerrar', { duration: 3000 });
            setTimeout(() => {
              this.dialogRef.close(true);
            }, 0);
          },
          error: (err) => {
            this.loading = false;
            this.snackBar.open(err.error?.message || 'Error al actualizar el rol', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }

  getPerfilClass(perfil: string): string {
    if (perfil === 'Administrador') return 'perfil-admin';
    if (perfil === 'Gestión Social') return 'perfil-social';
    if (perfil === 'Auditor') return 'perfil-auditor';
    return 'perfil-default';
  }
}
