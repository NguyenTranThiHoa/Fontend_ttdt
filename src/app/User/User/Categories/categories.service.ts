import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { News_Events } from '../../../Admin/admin/news_events/news_events.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  // private apiUrl = 'https://localhost:7253/api/News_events';
  // private apiUrl2 = 'https://localhost:7253/api/Categories';

  private apiUrl = `${environment.apiBaseUrl}/News_events`;
  private apiUrl2 = `${environment.apiBaseUrl}/Categories`;

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

  /** 📌 **Lấy danh sách tin tức theo danh mục** */
  getNewsByCategory(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetNews_EventsByNameCategory/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tên danh mục từ ID** */
  getCategoryNameById(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl2}/GetCategoryById/${categoryId}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy danh sách danh mục con theo tên danh mục cha** */
  getSubcategoriesByName(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl2}/GetAllSubCategoryNamesByName/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy 5 tin tức mới nhất theo danh mục** */
  GetTop5NewsByCategory(name: string): Observable<News_Events[]> {
    return this.http.get<News_Events[]>(`${this.apiUrl}/GetTop5LatestNews_EventsByCategory/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tin tức theo tên** */
  GetNews_EventByName(name: string): Observable<News_Events> {
    return this.http.get<News_Events>(`${this.apiUrl}/GetNews_EventsByName/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tin tức liên quan** */
  GetRelatedNews_Events(name: string): Observable<News_Events[]> {
    return this.http.get<News_Events[]>(`${this.apiUrl}/GetRelatedNews_Events/${name}`, { headers: this.getAuthHeaders() });
  }
}
