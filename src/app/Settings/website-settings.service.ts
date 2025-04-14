import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebsiteSettings } from '../Admin/Admin_Layouts/website-settings.model';

import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class WebsiteSettingsService {

  // private apiUrl = 'https://localhost:7253/api/WebsiteSettings';

  private apiUrl = `${environment.apiBaseUrl}/WebsiteSettings`;

  constructor(private http: HttpClient) { }
  
  // Lấy dữ liệu cài đặt
  getWebsiteSettings(): Observable<WebsiteSettings> {
    return this.http.get<WebsiteSettings>(`${this.apiUrl}/GetWebsiteSettings`);
  }

  // Cập nhật dữ liệu cài đặt
  updateWebsiteSettings(settings: WebsiteSettings): Observable<WebsiteSettings> {
    return this.http.put<WebsiteSettings>(`${this.apiUrl}/UpdateWebsiteSettings`, settings);
  }
}
