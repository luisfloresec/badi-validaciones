import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { OrganizationsService } from '../../organizations.service';

export interface GroupLeaderDialogData {
  organizationId: string;
  hasActiveRepresentative: boolean;
  mode: 'create' | 'edit';
  groupData?: any; // Para cuando se edite solo el grupo (no requerido por ahora)
}

@Component({
  selector: 'app-group-leader-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './group-leader-form-dialog.html',
  styleUrls: ['./group-leader-form-dialog.scss']
})
export class GroupLeaderFormDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  
  gruposEtarios: any[] = [];
  vulnerabilidades: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GroupLeaderFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupLeaderDialogData,
    private orgService: OrganizationsService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      grupoEtarioId: ['', Validators.required],
      vulnerabilidadId: ['', Validators.required],
      numeroPersonas: [1, [Validators.required, Validators.min(1)]],
      observaciones: [''],
      
      // Opciones de dirigente
      leaderOption: [data.hasActiveRepresentative ? 'use_active' : 'new_leader', Validators.required],
      
      // Datos del dirigente nuevo
      nombres: [''],
      apellidos: [''],
      cedula: [''],
      telefono: [''],
      email: ['']
    });

    this.onLeaderOptionChange();
    this.form.get('leaderOption')?.valueChanges.subscribe(() => {
      this.onLeaderOptionChange();
    });
  }

  ngOnInit(): void {
    this.loadCatalogs();
    
    if (this.data.mode === 'edit' && this.data.groupData) {
      const g = this.data.groupData;
      this.form.patchValue({
        nombre: g.nombre,
        grupoEtarioId: g.grupoEtario.id,
        vulnerabilidadId: g.vulnerabilidad.id,
        numeroPersonas: g.numeroPersonas,
        observaciones: g.observaciones
      });
    }
  }

  loadCatalogs(): void {
    this.orgService.getCatalogsByType('grupo_etario').subscribe({
      next: (res) => this.gruposEtarios = res,
      error: (err) => console.error('Error loading grupo_etario:', err)
    });
    this.orgService.getCatalogsByType('vulnerabilidad').subscribe({
      next: (res) => this.vulnerabilidades = res,
      error: (err) => console.error('Error loading vulnerabilidad:', err)
    });
  }

  onLeaderOptionChange(): void {
    const opt = this.form.get('leaderOption')?.value;
    const isNew = opt === 'new_leader';
    
    const controls = ['nombres', 'apellidos', 'cedula'];
    controls.forEach(ctrl => {
      const c = this.form.get(ctrl);
      if (isNew && this.data.mode === 'create') {
        c?.setValidators(ctrl === 'cedula' ? [Validators.required, Validators.pattern('^[0-9]{10}$')] : [Validators.required, Validators.maxLength(100)]);
      } else {
        c?.clearValidators();
      }
      c?.updateValueAndValidity();
    });

    const emailCtrl = this.form.get('email');
    if (isNew && this.data.mode === 'create') {
      emailCtrl?.setValidators([Validators.email, Validators.maxLength(120)]);
    } else {
      emailCtrl?.clearValidators();
    }
    emailCtrl?.updateValueAndValidity();
    
    const telCtrl = this.form.get('telefono');
    if (isNew && this.data.mode === 'create') {
      telCtrl?.setValidators([Validators.maxLength(20)]);
    } else {
      telCtrl?.clearValidators();
    }
    telCtrl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    
    const v = this.form.value;

    if (this.data.mode === 'edit') {
      const payload = {
        nombre: v.nombre,
        grupoEtarioId: v.grupoEtarioId,
        vulnerabilidadId: v.vulnerabilidadId,
        numeroPersonas: v.numeroPersonas,
        observaciones: v.observaciones || null
      };

      this.orgService.updateAttendedGroup(this.data.groupData.id, payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Ocurrió un error al editar el grupo atendido.';
        }
      });
      return;
    }

    // Modo create (Grupo + Dirigente)
    const isNew = v.leaderOption === 'new_leader';
    const emailVal = v.email === '' ? null : v.email;

    const payload = {
      nombre: v.nombre,
      grupoEtarioId: v.grupoEtarioId,
      vulnerabilidadId: v.vulnerabilidadId,
      numeroPersonas: v.numeroPersonas,
      observaciones: v.observaciones || undefined,
      useActiveRepresentative: !isNew,
      ...(isNew && {
        nombres: v.nombres,
        apellidos: v.apellidos,
        cedula: v.cedula || undefined,
        telefono: v.telefono || undefined,
        email: emailVal
      })
    };

    this.orgService.createAttendedGroupWithLeader(this.data.organizationId, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Ocurrió un error al guardar el grupo y dirigente.';
      }
    });
  }
}
