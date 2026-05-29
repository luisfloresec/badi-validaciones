import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrganizationsService } from '../../organizations.service';

export interface LeaderDialogData {
  groupId: string;
  hasActiveRepresentative: boolean;
  mode: 'create' | 'edit' | 'replace';
  leaderData?: any; // Datos precargados en edit
}

@Component({
  selector: 'app-leader-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './leader-form-dialog.html',
  styleUrls: ['./leader-form-dialog.scss']
})
export class LeaderFormDialogComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LeaderFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LeaderDialogData,
    private orgService: OrganizationsService
  ) {
    this.form = this.fb.group({
      leaderOption: [data.hasActiveRepresentative && data.mode !== 'edit' ? 'use_active' : 'new_leader', Validators.required],
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
    if (this.data.mode === 'edit' && this.data.leaderData) {
      const l = this.data.leaderData;
      this.form.patchValue({
        leaderOption: 'new_leader',
        nombres: l.nombres,
        apellidos: l.apellidos,
        cedula: l.cedula,
        telefono: l.telefono,
        email: l.email
      });
      this.form.get('leaderOption')?.disable(); // En edición no se puede cambiar de tipo
    }
  }

  onLeaderOptionChange(): void {
    const opt = this.form.get('leaderOption')?.value;
    const isNew = opt === 'new_leader';
    
    const controls = ['nombres', 'apellidos', 'cedula'];
    controls.forEach(ctrl => {
      const c = this.form.get(ctrl);
      if (isNew) {
        c?.setValidators(ctrl === 'cedula' ? [Validators.required, Validators.pattern('^[0-9]{10}$')] : [Validators.required, Validators.maxLength(100)]);
      } else {
        c?.clearValidators();
      }
      c?.updateValueAndValidity();
    });

    const emailCtrl = this.form.get('email');
    if (isNew) {
      emailCtrl?.setValidators([Validators.email, Validators.maxLength(120)]);
    } else {
      emailCtrl?.clearValidators();
    }
    emailCtrl?.updateValueAndValidity();
    
    const telCtrl = this.form.get('telefono');
    if (isNew) {
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
    
    const v = this.form.getRawValue(); // Usa getRawValue para incluir controles disabled
    const isNew = v.leaderOption === 'new_leader';
    const emailVal = v.email === '' ? null : v.email;

    if (this.data.mode === 'edit') {
      const payload = {
        nombres: v.nombres,
        apellidos: v.apellidos,
        cedula: v.cedula || undefined,
        telefono: v.telefono || undefined,
        email: emailVal
      };

      this.orgService.updateLeader(this.data.leaderData.id, payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Ocurrió un error al editar el dirigente.';
        }
      });
      return;
    }

    const payload = {
      useActiveRepresentative: !isNew,
      ...(isNew && {
        nombres: v.nombres,
        apellidos: v.apellidos,
        cedula: v.cedula || undefined,
        telefono: v.telefono || undefined,
        email: emailVal
      })
    };

    if (this.data.mode === 'create' || this.data.mode === 'replace') {
      this.orgService.replaceLeader(this.data.groupId, payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Ocurrió un error al guardar el dirigente.';
        }
      });
    }
  }
}
