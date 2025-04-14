import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { News_Events } from '../news_events/news_events.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // private apiUrl = 'https://localhost:7253/api/Statistics';
  // private apiUrl1 = 'https://localhost:7253/api/News_events';

  private apiUrl = `${environment.apiBaseUrl}/Statistics`;
  private apiUrl1 = `${environment.apiBaseUrl}/News_events`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("🚨 Không có token, API sẽ bị lỗi 401!");
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  GetTotalNewsEvents(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/GetTotalNewsEvents`, { headers: this.getAuthHeaders() });
  }

  GetTotalDocuments(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/GetTotalDocuments`, { headers: this.getAuthHeaders() });
  }

  GetTotalProcedures(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/GetTotalProcedures`, { headers: this.getAuthHeaders() });
  }

  GetTotalIntroduces(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/GetTotalIntroduces`, { headers: this.getAuthHeaders() });
  }

  GetStatistics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetStatistics`, { headers: this.getAuthHeaders() });
  }

  getTopViewedNews(count: number): Observable<News_Events[]> {
    return this.http.get<News_Events[]>(`${this.apiUrl1}/GetTopViewedNews/top-viewed/${count}`, { headers: this.getAuthHeaders() });
  }

  // Trả về lượt xem theo danh mục
  GetNewsViewsByCategory(): Observable<{ category: string; totalViews: number }[]> {
    return this.http.get<{ category: string; totalViews: number }[]>(`${this.apiUrl}/GetNewsViewsByCategory`, { headers: this.getAuthHeaders() });
  }

  // Lấy số lượt xem bài viết theo ngày
  GetNewsViewsOverTime(): Observable<{ date: string; totalViews: number }[]> {
    return this.http.get<{ date: string; totalViews: number }[]>(`${this.apiUrl}/GetNewsViewsOverTime`, { headers: this.getAuthHeaders() });
  }

}
