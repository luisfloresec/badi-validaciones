import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FluidModule } from 'primeng/fluid';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { OrganizationsService } from '../../organizations.service';
import { UppercaseDirective } from '../../../../shared/directives/uppercase.directive';

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
    MatDividerModule,
    MatChipsModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    IftaLabelModule,
    FluidModule,
    ButtonModule,
    RadioButtonModule,
    MultiSelectModule,
    UppercaseDirective
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

  get selectedVulnerabilidades() {
    const ids = this.form.get('vulnerabilidadIds')?.value || [];
    return this.vulnerabilidades.filter(v => ids.includes(v.id));
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GroupLeaderFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupLeaderDialogData,
    private orgService: OrganizationsService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      grupoEtarioId: ['', Validators.required],
      vulnerabilidadIds: [[], Validators.required],
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
        vulnerabilidadIds: g.vulnerabilidades?.map((v: any) => v.id) || (g.vulnerabilidad ? [g.vulnerabilidad.id] : []),
        numeroPersonas: g.numeroPersonas,
        observaciones: g.observaciones
      });
    }
  }

  loadCatalogs(): void {
    this.orgService.getCatalogsByType('grupo_etario').subscribe({
      next: (res) => { this.gruposEtarios = res; this.cdr.detectChanges(); },
      error: (err) => console.error('Error loading grupo_etario:', err)
    });
    this.orgService.getCatalogsByType('vulnerabilidad').subscribe({
      next: (res) => { this.vulnerabilidades = res; this.cdr.detectChanges(); },
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

  // --- MULTI-SELECT HELPERS ---
  getOptionName(options: any[], id: string): string {
    if (!options || options.length === 0) return 'Cargando...';
    const opt = options.find(o => o.id == id);
    return opt ? opt.nombre : 'Vulnerabilidad no disponible';
  }

  removeSelectedOption(controlName: string, id: string): void {
    const control = this.form.get(controlName);
    if (control && control.value) {
      const newValue = control.value.filter((val: string) => val !== id);
      control.setValue(newValue);
      control.markAsDirty();
      this.cdr.detectChanges();
    }
  }

  removeVulnerabilidad(id: string | number): void {
    const control = this.form.get('vulnerabilidadIds');
    const current = control?.value || [];
    control?.setValue(current.filter((value: any) => value !== id));
    control?.markAsDirty();
    control?.markAsTouched();
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    const v = this.form.value;

    if (this.data.mode === 'edit') {
      const payload = {
        nombre: v.nombre,
        grupoEtarioId: v.grupoEtarioId,
        vulnerabilidadIds: v.vulnerabilidadIds,
        numeroPersonas: v.numeroPersonas,
        observaciones: v.observaciones || null
      };

      this.orgService.updateAttendedGroup(this.data.groupData.id, payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.cdr.detectChanges();
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Ocurrió un error al editar el grupo atendido.';
          this.cdr.detectChanges();
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
      vulnerabilidadIds: v.vulnerabilidadIds,
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
        this.cdr.detectChanges();
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Ocurrió un error al guardar el grupo y dirigente.';
        this.cdr.detectChanges();
      }
    });
  }
}
