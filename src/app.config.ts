import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withRouterConfig } from '@angular/router';
import { CommonModule } from '@angular/common';
import { routes } from './app.routes';

import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(
      routes, 
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    importProvidersFrom(CKEditorModule), // ✅ Đưa CKEditor vào Standalone API
    CommonModule,
  ]
};
