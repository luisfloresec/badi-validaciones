import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { routes } from './app.routes';

const badiPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f1faf7',
      100: '#d9eee7',
      200: '#b4ded1',
      300: '#8fcebb',
      400: '#6abfa5',
      500: '#01785a',
      600: '#016b50',
      700: '#015641',
      800: '#014936',
      900: '#013d2f',
      950: '#00261c'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideNativeDateAdapter(),
    provideAnimationsAsync(),
    providePrimeNG({
        theme: {
            preset: badiPreset,
            options: {
                darkModeSelector: '.badi-dark-mode',
                cssLayer: {
                    name: 'primeng',
                    order: 'tailwind-base, primeng, tailwind-utilities'
                }
            }
        }
    })
  ]
};
