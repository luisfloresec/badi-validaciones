import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  OrganizationsService,
  OrganizationTypeRef,
  CatalogRef
} from '../organizations.service';

// Custom validator for duplicate social networks
function uniqueSocialNetworkValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof FormArray)) return null;
  
  const types = control.controls.map(c => c.get('tipo')?.value).filter(val => val && val !== 'otro');
  const uniqueTypes = new Set(types);
  
  if (types.length !== uniqueTypes.size) {
    return { duplicateNetwork: true };
  }
  return null;
}

@Component({
  selector: 'app-organization-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './organization-form.html',
  styleUrl: './organization-form.scss'
})
export class OrganizationFormComponent implements OnInit {

  orgForm: FormGroup;

  // Catálogos
  organizationTypes: OrganizationTypeRef[] = [];
  accionSocialList: CatalogRef[] = [];
  segmentoList: CatalogRef[] = [];
  frecuenciaRetiroList: CatalogRef[] = [];
  transporteList: CatalogRef[] = [];

  // Tipos de Redes Sociales Permitidos
  socialNetworkTypes = [
    { label: 'Facebook', value: 'facebook', prefix: 'https://facebook.com/' },
    { label: 'Instagram', value: 'instagram', prefix: 'https://instagram.com/' },
    { label: 'WhatsApp', value: 'whatsapp', prefix: 'https://wa.me/593' },
    { label: 'Página web', value: 'pagina_web', prefix: 'https://' },
    { label: 'TikTok', value: 'tiktok', prefix: 'https://www.tiktok.com/@' },
    { label: 'X / Twitter', value: 'x_twitter', prefix: 'https://x.com/' },
    { label: 'Otro', value: 'otro', prefix: '' }
  ];

  // Estados
  loadingCatalogs = true;
  saving = false;
  error: string | null = null;
  formError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private orgService: OrganizationsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.orgForm = this.fb.group({
      tipoOrganizacionId: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
      razonSocial: ['', Validators.required],
      email: ['', Validators.email],
      ciudad: ['', Validators.required],
      sectorBarrio: [''],
      direccion: ['', Validators.required],
      referenciaDireccion: [''],
      accionSocialId: ['', Validators.required],
      segmentoId: ['', Validators.required],
      frecuenciaRetiroId: [''],
      cuotaRecuperacionEstimada: [null, Validators.min(0)],
      totalPersonasAtendidas: [0, [Validators.required, Validators.min(0)]],
      transporteId: [''],
      redesSociales: this.fb.array([], uniqueSocialNetworkValidator),
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.loadCatalogs();
  }

  // --- Dynamic Form Methods for Social Networks ---
  get socialNetworks(): FormArray {
    return this.orgForm.get('redesSociales') as FormArray;
  }

  addSocialNetwork(): void {
    const socialGroup = this.fb.group({
      tipo: ['', Validators.required],
      valor: [{ value: '', disabled: true }, [Validators.required, this.whitespaceValidator]]
    });

    // Escuchar cambios en tipo para habilitar/deshabilitar valor
    socialGroup.get('tipo')?.valueChanges.subscribe(tipo => {
      const valorControl = socialGroup.get('valor');
      if (tipo) {
        valorControl?.enable();
      } else {
        valorControl?.disable();
        valorControl?.setValue('');
      }
      this.socialNetworks.updateValueAndValidity(); // trigger parent validator
    });

    this.socialNetworks.push(socialGroup);
  }

  removeSocialNetwork(index: number): void {
    this.socialNetworks.removeAt(index);
  }

  getPrefix(tipo: string): string {
    const found = this.socialNetworkTypes.find(t => t.value === tipo);
    return found ? found.prefix : '';
  }

  whitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && control.value.trim().length === 0) {
      return { required: true };
    }
    return null;
  }

  // --- Catalog Loading ---
  loadCatalogs(): void {
    this.loadingCatalogs = true;
    this.error = null;

    forkJoin({
      types: this.orgService.getOrganizationTypes(),
      accionSocial: this.orgService.getCatalogsByType('accion_social'),
      segmento: this.orgService.getCatalogsByType('segmento'),
      frecuencia: this.orgService.getCatalogsByType('frecuencia_retiro'),
      transporte: this.orgService.getCatalogsByType('transporte')
    })
    .pipe(finalize(() => {
      this.loadingCatalogs = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (results) => {
        this.organizationTypes = results.types;
        this.accionSocialList = results.accionSocial;
        this.segmentoList = results.segmento;
        this.frecuenciaRetiroList = results.frecuencia;
        this.transporteList = results.transporte;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading catalogs:', err);
        this.error = 'No se pudieron cargar los catálogos del sistema.';
        this.cdr.detectChanges();
      }
    });
  }

  // --- Form Submission ---
  onSubmit(): void {
    this.formError = null;
    this.error = null;

    if (this.orgForm.invalid) {
      this.orgForm.markAllAsTouched();
      this.socialNetworks.controls.forEach(control => {
        control.markAllAsTouched();
      });
      this.formError = 'Revisa los campos obligatorios o con errores antes de guardar.';
      return;
    }

    this.saving = true;

    const formValue = this.orgForm.getRawValue(); // getRawValue() gets disabled fields too
    
    // Transformar el FormArray a un JSON object
    const redesJson: Record<string, string> = {};
    let otroCounter = 1;
    
    for (const item of formValue.redesSociales) {
      let key = item.tipo;
      let rawVal = item.valor.trim();
      const prefix = this.getPrefix(key);
      
      // Cleanup por red social
      if (key === 'whatsapp') {
        // Dejar solo números
        rawVal = rawVal.replace(/[^0-9]/g, '');
      } else if (key === 'pagina_web') {
        // Quitar https:// si el usuario lo tipeó
        rawVal = rawVal.replace(/^https?:\/\//i, '');
      } else if (key === 'facebook' || key === 'instagram' || key === 'tiktok' || key === 'x_twitter') {
        // Quitar URLs completas si el usuario las pega
        rawVal = rawVal.replace(/^https?:\/\/(www\.)?(facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com)\/(@)?/i, '');
        // Quitar @ si lo tipeó en tiktok/x_twitter extra
        if (key === 'tiktok' || key === 'x_twitter') {
          rawVal = rawVal.replace(/^@/, '');
        }
      }

      let finalVal = prefix + rawVal;

      if (key === 'otro') {
        key = `otro_${otroCounter}`;
        otroCounter++;
      }
      
      redesJson[key] = finalVal;
    }

    // Mapear payload
    const payload = {
      tipoOrganizacionId: formValue.tipoOrganizacionId,
      ruc: formValue.ruc,
      razonSocial: formValue.razonSocial,
      nombreComercial: formValue.razonSocial,
      email: formValue.email || null,
      ciudad: formValue.ciudad,
      sectorBarrio: formValue.sectorBarrio || null,
      direccion: formValue.direccion,
      referenciaDireccion: formValue.referenciaDireccion || null,
      accionSocialId: formValue.accionSocialId,
      segmentoId: formValue.segmentoId,
      frecuenciaRetiroId: formValue.frecuenciaRetiroId || null,
      cuotaRecuperacionEstimada: (formValue.cuotaRecuperacionEstimada !== null && formValue.cuotaRecuperacionEstimada !== '') ? Number(formValue.cuotaRecuperacionEstimada) : null,
      totalPersonasAtendidas: Number(formValue.totalPersonasAtendidas),
      transporteId: formValue.transporteId || null,
      redesSociales: redesJson,
      observaciones: formValue.observaciones || null
    };

    console.log('payload a enviar:', payload);

    this.orgService.createOrganization(payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response) => {
          if (response && response.id) {
            this.router.navigate(['/organizations', response.id]);
          } else {
            this.router.navigate(['/organizations']);
          }
        },
        error: (err) => {
          console.error('Error creating organization:', err);
          this.error = err?.error?.message || 'No se pudo registrar la organización. Revisa los datos ingresados.';
          this.cdr.detectChanges();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/organizations']);
  }
}
