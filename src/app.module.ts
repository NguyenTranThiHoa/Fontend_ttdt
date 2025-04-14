import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes'; // Đảm bảo đường dẫn đúng
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonModule } from '@angular/common';  // Import CommonModule
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { QuillModule } from 'ngx-quill';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToolbarService, TableService, QuickToolbarService, 
  LinkService, ImageService, HtmlEditorService, MarkdownEditorService } from '@syncfusion/ej2-angular-richtexteditor';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './app/Auth/Auth.service';
import { AuthInterceptor } from './app/Auth/auth.interceptor';


@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    NgxPaginationModule,
    CommonModule,  // Thêm CommonModule vào imports
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    QuillModule.forRoot(), // Khởi tạo Quill Editor
    RouterModule.forRoot(routes), // Cấu hình router
    QuillModule.forRoot({
      modules: {
        imageResize: {
          displaySize: true,
          modules: ['Resize', 'DisplaySize', 'Toolbar']
        }
      }
    })
  ],
  providers: [ToolbarService, LinkService, ImageService, HtmlEditorService, TableService,
    QuickToolbarService, MarkdownEditorService, AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  
  bootstrap: []
})
export class AppModule { }