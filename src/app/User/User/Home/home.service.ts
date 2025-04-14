
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { News_Events } from '../../../Admin/admin/news_events/news_events.model';
import { Observable } from 'rxjs';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  // private apiUrl = 'https://localhost:7253/api/News_events';
  // private apiUrl2 = 'https://localhost:7253/api/Category_documents';
  // private apiUrl3 = 'https://localhost:7253/api/Documents';

  private apiUrl = `${environment.apiBaseUrl}/News_events`;
  private apiUrl2 = `${environment.apiBaseUrl}/Category_documents`;
  private apiUrl3 = `${environment.apiBaseUrl}/Documents`;

  constructor(private http: HttpClient) {}

  /** 📌 **Thêm Authorization vào Header** */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("🚨 Không có token, API sẽ bị lỗi 401!");
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** 📌 **Lấy danh sách tin tức** */
  GetNews(): Observable<News_Events[]> {
    return this.http.get<News_Events[]>(`${this.apiUrl}/GetNews_Events`, { headers: this.getAuthHeaders() }); 
  }

  /** 📌 **Lấy tin tức theo ID** */
  GetNews_EventById(id: number): Observable<News_Events> {
    return this.http.get<News_Events>(`${this.apiUrl}/GetNews_EventsById/${id}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy 5 bài viết mới nhất** */
  GetTop5News_Events(): Observable<News_Events[]> {
    return this.http.get<News_Events[]>(`${this.apiUrl}/GetTop5LatestNews_Events`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tin tức nổi bật** */
  GetHotNews(): Observable<News_Events[]> {
    return this.http.get<News_Events[]>(`${this.apiUrl}/GetFeaturedNews/featured`, { headers: this.getAuthHeaders() }); 
  }

  /** 📌 **Lấy danh mục văn bản theo cấp bậc** */
  getCategoryDocHierarchy(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl2}/GetCat_DocHierarchy`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy danh sách danh mục con theo danh mục cha** */
  getSubcategoriesByName(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl2}/GetAllSubCat_DocumentNamesByName/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy văn bản theo danh mục** */
  getDocByCategory(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl3}/GetDocByNameCategory/${name}`, { headers: this.getAuthHeaders() });
  }
}
