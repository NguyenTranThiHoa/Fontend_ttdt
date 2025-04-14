import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebsiteSettings } from '../../Admin/Admin_Layouts/website-settings.model';

import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class UserLayoutService {
  
  // private apiUrl = 'https://localhost:7253/api/Categories';
  // private apiUrl2 = 'https://localhost:7253/api/Category_documents';
  // private apiUrl3 = 'https://localhost:7253/api/Categories_introduce';
  // private apiUrl4 = 'https://localhost:7253/api/WebsiteSettings';

  private apiUrl = `${environment.apiBaseUrl}/Categories`;
  private apiUrl2 = `${environment.apiBaseUrl}/Category_documents`;
  private apiUrl3 = `${environment.apiBaseUrl}/Categories_introduce`;
  private apiUrl4 = `${environment.apiBaseUrl}/WebsiteSettings`;

  constructor(private http: HttpClient) {}

  // 🔥 **Thêm Authorization vào Header**
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("🚨 Không có token, API sẽ bị lỗi 401!");
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** 📌 **Gọi API lấy danh mục theo cấp bậc** */
  getCategoryHierarchy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetCategoryHierarchy`, { headers: this.getAuthHeaders() });
  }

  getCategoryDocHierarchy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl2}/GetCat_DocHierarchy`, { headers: this.getAuthHeaders() });
  }

  getCategoryIntroduce(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl3}/GetCategories_introduces`, { headers: this.getAuthHeaders() });
  }

  // Lấy dữ liệu cài đặt
  getWebsiteSettings(): Observable<WebsiteSettings[]> {
    return this.http.get<WebsiteSettings[]>(`${this.apiUrl4}/GetWebsiteSettings`);
  }

}
