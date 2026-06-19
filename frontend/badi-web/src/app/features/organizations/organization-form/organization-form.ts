import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { FluidModule } from 'primeng/fluid';
import {
  OrganizationsService,
  OrganizationTypeRef,
  CatalogRef
} from '../organizations.service';
import {
  LocationService,
  Province,
  City
} from '../../../core/services/location.service';

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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    IftaLabelModule,
    MessageModule,
    FluidModule
  ],
  templateUrl: './organization-form.html',
  styleUrl: './organization-form.scss'
})
export class OrganizationFormComponent implements OnInit {

  orgForm: FormGroup;
  isEditMode = false;
  orgId: string | null = null;

  // Catálogos
  organizationTypes: OrganizationTypeRef[] = [];
  accionSocialList: CatalogRef[] = [];
  segmentoList: CatalogRef[] = [];
  frecuenciaRetiroList: CatalogRef[] = [];
  transporteList: CatalogRef[] = [];

  // Locations
  provincias: Province[] = [];
  ciudades: City[] = [];
  loadingCities = false;

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
    private locationService: LocationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.orgForm = this.fb.group({
      tipoOrganizacionId: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.pattern('^[0-9]{13}$')]],
      razonSocial: ['', Validators.required],
      email: ['', Validators.email],
      provinceId: ['', Validators.required],
      cityId: [{ value: '', disabled: true }, Validators.required],
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
    this.orgId = this.route.snapshot.paramMap.get('id');
    if (this.orgId) {
      this.isEditMode = true;
    }
    this.loadData();
  }

  // --- Dynamic Form Methods for Social Networks ---
  get socialNetworks(): FormArray {
    return this.orgForm.get('redesSociales') as FormArray;
  }

  addSocialNetwork(tipoStr = '', valorStr = ''): void {
    const socialGroup = this.fb.group({
      tipo: [tipoStr, Validators.required],
      valor: [{ value: valorStr, disabled: !tipoStr }, [Validators.required, this.whitespaceValidator]]
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

  getSocialNetworkPlaceholder(tipo: string): string {
    switch (tipo) {
      case 'facebook':
      case 'tiktok':
      case 'x_twitter':
        return 'fundacionbadi';
      case 'instagram':
        return 'fundacionbadi.ec';
      case 'whatsapp':
        return '0987654321';
      case 'pagina_web':
        return 'organizacion.org';
      case 'youtube':
        return '@fundacionbadi o canal-badi';
      case 'linkedin':
        return 'fundacion-badi';
      case 'otro':
        return 'enlace o referencia oficial';
      default:
        return 'Seleccione primero el tipo de red social';
    }
  }

  getSocialNetworkHint(tipo: string): string {
    switch (tipo) {
      case 'facebook':
        return 'Escriba solo el usuario o página, no la URL completa.';
      case 'instagram':
      case 'tiktok':
      case 'x_twitter':
        return 'Escriba solo el usuario, sin @ si ya se muestra como prefijo.';
      case 'whatsapp':
        return 'Ingrese el número de contacto, solo dígitos.';
      case 'pagina_web':
        return 'Ingrese el dominio o sitio web institucional.';
      case 'youtube':
        return 'Ingrese el usuario, canal o identificador.';
      case 'linkedin':
        return 'Ingrese el identificador de la página u organización.';
      case 'otro':
        return 'Ingrese el enlace o referencia correspondiente.';
      default:
        return '';
    }
  }

  whitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && control.value.trim().length === 0) {
      return { required: true };
    }
    return null;
  }

  // --- Data Loading ---
  loadData(): void {
    this.loadingCatalogs = true;
    this.error = null;

    const orgReq = this.isEditMode && this.orgId ? this.orgService.getFullDetail(this.orgId) : of(null);

    forkJoin({
      types: this.orgService.getOrganizationTypes(),
      accionSocial: this.orgService.getCatalogsByType('accion_social'),
      segmento: this.orgService.getCatalogsByType('segmento'),
      frecuencia: this.orgService.getCatalogsByType('frecuencia_retiro'),
      transporte: this.orgService.getCatalogsByType('transporte'),
      provincias: this.locationService.getProvinces(),
      orgDetail: orgReq
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
        this.provincias = results.provincias;
        
        if (this.isEditMode && results.orgDetail) {
          this.patchOrganization(results.orgDetail.organizacion);
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.error = 'No se pudieron cargar los datos necesarios del sistema.';
        this.cdr.detectChanges();
      }
    });
  }

  onProvinceChange(provinceId: string, cityIdToSelect?: string): void {
    if (!provinceId) {
      this.ciudades = [];
      this.orgForm.get('cityId')?.setValue('');
      this.orgForm.get('cityId')?.disable();
      return;
    }

    this.loadingCities = true;
    this.orgForm.get('cityId')?.disable();
    
    if (!cityIdToSelect) {
      this.orgForm.get('cityId')?.setValue('');
    }

    this.locationService.getCitiesByProvince(provinceId).subscribe({
      next: (cities: City[]) => {
        this.ciudades = cities;
        this.orgForm.get('cityId')?.enable();
        if (cityIdToSelect) {
          this.orgForm.get('cityId')?.setValue(cityIdToSelect);
        }
        this.loadingCities = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading cities:', err);
        this.ciudades = [];
        this.loadingCities = false;
        this.cdr.detectChanges();
      }
    });
  }

  patchOrganization(org: any): void {
    this.orgForm.patchValue({
      tipoOrganizacionId: org.tipoOrganizacion?.id || null,
      ruc: org.ruc,
      razonSocial: org.razonSocial,
      email: org.email,
      provinceId: org.provincia?.id || null,
      cityId: org.ciudadCatalogo?.id || null,
      sectorBarrio: org.sectorBarrio,
      direccion: org.direccion,
      referenciaDireccion: org.referenciaDireccion,
      accionSocialId: org.accionSocial?.id || null,
      segmentoId: org.segmento?.id || null,
      frecuenciaRetiroId: org.frecuenciaRetiro?.id || null,
      cuotaRecuperacionEstimada: org.cuotaRecuperacionEstimada ? Number(org.cuotaRecuperacionEstimada) : null,
      totalPersonasAtendidas: org.totalPersonasAtendidas,
      transporteId: org.transporte?.id || null,
      observaciones: org.observaciones
    });

    if (org.provincia?.id) {
      this.onProvinceChange(org.provincia.id, org.ciudadCatalogo?.id);
    }

    if (org.redesSociales && Object.keys(org.redesSociales).length > 0) {
      Object.entries(org.redesSociales).forEach(([key, value]) => {
        let mappedType = key;
        if (key.startsWith('otro_')) mappedType = 'otro';
        
        // Clean prefix for UI binding
        const prefix = this.getPrefix(mappedType);
        let valStr = value as string;
        if (prefix && valStr.startsWith(prefix)) {
          valStr = valStr.substring(prefix.length);
        }

        this.addSocialNetwork(mappedType, valStr);
      });
    }
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
      this.snackBar.open('Revisa los campos resaltados antes de guardar.', 'Cerrar', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['badi-snackbar', 'badi-snackbar-warning']
      });
      this.scrollToFirstInvalidControl();
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
        rawVal = rawVal.replace(/[^0-9]/g, '');
      } else if (key === 'pagina_web') {
        rawVal = rawVal.replace(/^https?:\/\//i, '');
      } else if (key === 'facebook' || key === 'instagram' || key === 'tiktok' || key === 'x_twitter') {
        rawVal = rawVal.replace(/^https?:\/\/(www\.)?(facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com)\/(@)?/i, '');
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
      provinceId: formValue.provinceId,
      cityId: formValue.cityId,
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

    const request$ = this.isEditMode && this.orgId
      ? this.orgService.updateOrganization(this.orgId, payload)
      : this.orgService.createOrganization(payload);

    request$
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (response: any) => {
          const redirectId = this.isEditMode ? this.orgId : response?.id;
          if (redirectId) {
            this.router.navigate(['/organizations', redirectId]);
          } else {
            this.router.navigate(['/organizations']);
          }
        },
        error: (err) => {
          console.error('Error saving organization:', err);
          this.handleBackendError(err);
          this.cdr.detectChanges();
        }
      });
  }

  goBack(): void {
    if (this.isEditMode && this.orgId) {
      this.router.navigate(['/organizations', this.orgId]);
    } else {
      this.router.navigate(['/organizations']);
    }
  }

  // --- Helpers UX ---
  private scrollToFirstInvalidControl(): void {
    const firstInvalidControl = Object.keys(this.orgForm.controls).find(key => {
      return this.orgForm.get(key)?.invalid;
    });

    if (firstInvalidControl) {
      this.scrollToControl(firstInvalidControl);
    }
  }

  private scrollToControl(controlName: string): void {
    setTimeout(() => {
      const element = document.getElementById(controlName) || document.querySelector(`[formControlName="${controlName}"]`) || document.querySelector(`[inputId="${controlName}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof (element as any).focus === 'function') {
          (element as HTMLElement).focus();
        }
      }
    }, 100);
  }

  private handleBackendError(err: any): void {
    const errorMessage = err?.error?.message || '';
    const isArrayMessage = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
    
    if (isArrayMessage.includes('RUC') || isArrayMessage.includes('ruc')) {
      this.setRucDuplicateError('Ya existe una organización con este RUC.');
    } else {
      const msg = isArrayMessage || 'No se pudo guardar la organización. Inténtalo nuevamente.';
      this.snackBar.open(msg, 'Cerrar', { 
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['badi-snackbar', 'badi-snackbar-error']
      });
      this.error = msg;
    }
  }

  private setRucDuplicateError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { 
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['badi-snackbar', 'badi-snackbar-error']
    });
    const rucControl = this.orgForm.get('ruc');
    if (rucControl) {
      rucControl.setErrors({ ...rucControl.errors, duplicated: true });
      this.scrollToControl('ruc');
    }
  }
}
