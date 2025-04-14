import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Accounts } from './Accounts.model';
import { WebsiteSettings } from '../Admin/Admin_Layouts/website-settings.model';
import { AssignPermissions } from '../Admin/admin/accounts/assignPermissions.model';

import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // private apiUrl = 'https://localhost:7253/api/Auth';

  // private apiUrl1 = 'https://localhost:7253/api/WebsiteSettings';

  private apiUrl = `${environment.apiBaseUrl}/Auth`;
  private apiUrl1 = `${environment.apiBaseUrl}/WebsiteSettings`;

  constructor(private http: HttpClient) { }
  
    /** 📌 **Thêm Authorization vào Header** */
    private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("🚨 Không có token, API sẽ bị lỗi 401!");
        return new HttpHeaders();
      }
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
  

  login(data: any): Observable<any> {
    return this.http.post<Accounts[]>(`${this.apiUrl}/Login`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/Register`, data);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post(`${this.apiUrl}/RefreshToken`, { refreshToken });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  }

  /************************************* */
  
  // Lấy dữ liệu cài đặt
  getWebsiteSettings(): Observable<WebsiteSettings[]> {
    return this.http.get<WebsiteSettings[]>(`${this.apiUrl1}/GetWebsiteSettings`);
  }

  // Cập nhật dữ liệu cài đặt
  updateWebsiteSettings(settings: WebsiteSettings): Observable<WebsiteSettings> {
    return this.http.put<WebsiteSettings>(`${this.apiUrl1}/UpdateWebsiteSettings`, settings);
  }

  UploadImage(formData: FormData): Observable<{ imagePath: string }> {
      return this.http.post<{ imagePath: string }>(`${this.apiUrl1}/UploadImage/upload-image`, formData);
  }

  /** 📌 **Gửi quyền hạn lên Server** */
  getPermissionsByManagerId(managerId: number): Observable<AssignPermissions> {
    return this.http.get<AssignPermissions>(`${this.apiUrl}/GetManagerPermissions/GetManagerPermissions/${managerId}`, { headers: this.getAuthHeaders() });
  }

}