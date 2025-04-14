import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { News_Events } from './news_events.model';
import { Categories } from '../categories/categories.component.model';
import { Accounts } from '../../../Auth/Accounts.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class NewsEventsService {
  // private apiUrlCategories = 'https://localhost:7253/api/Categories';
  // private apiUrlAccounts = 'https://localhost:7253/api/Accounts';
  // private apiUrlNews = 'https://localhost:7253/api/News_events';

  private apiUrlCategories = `${environment.apiBaseUrl}/Categories`;
  private apiUrlAccounts = `${environment.apiBaseUrl}/Accounts`;
  private apiUrlNews = `${environment.apiBaseUrl}/News_events`;

  constructor(private http: HttpClient) {}

  // 🔥 Thêm Authorization vào Header của request
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("🚨 Không có token, API sẽ bị lỗi 401!");
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  GetNews_Events(isVisible?: boolean): Observable<News_Events[]> {
    let url = `${this.apiUrlNews}/GetNews_Events`;
    if (isVisible !== undefined) {
      url += `?isVisible=${isVisible}`;
    }
    return this.http.get<News_Events[]>(url, { headers: this.getAuthHeaders() });
  }

  GetCategories(): Observable<Categories[]> {
    return this.http.get<Categories[]>(`${this.apiUrlCategories}/GetCategories`, { headers: this.getAuthHeaders() });
  }

  GetAccounts(): Observable<Accounts[]> {
    return this.http.get<Accounts[]>(`${this.apiUrlAccounts}/GetAccounts`, { headers: this.getAuthHeaders() });
  }

  GetNews_EventsById(id: number): Observable<News_Events> {
    return this.http.get<News_Events>(`${this.apiUrlNews}/GetNews_EventsById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateNews_Events(news_events: News_Events): Observable<News_Events> {
    return this.http.post<News_Events>(`${this.apiUrlNews}/CreateNews_Events`, news_events, { headers: this.getAuthHeaders() });
  }

  UpdateNews_Events(id: number, news_events: News_Events): Observable<News_Events> {
    return this.http.put<News_Events>(`${this.apiUrlNews}/UpdateNews_Events/${id}`, news_events, { headers: this.getAuthHeaders() });
  }

  DeleteNews_Events(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlNews}/DeleteNews_Events/${id}`, { headers: this.getAuthHeaders() });
  }

  UploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrlNews}/UploadImage/upload-image/`, formData, { headers: this.getAuthHeaders() });
  }

  // SetVisibility(id: number, isVisible: boolean): Observable<any> {
  //   return this.http.put(`${this.apiUrlNews}/SetVisibility/SetVisibility/${id}`, { isVisible }, { headers: this.getAuthHeaders() });
  // }

  SetVisibility(id: number, isVisible: boolean): Observable<News_Events> {
    return this.http.put<News_Events>(`${this.apiUrlNews}/SetVisibility/SetVisibility/${id}`, isVisible, {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json')
    });
  }
}
