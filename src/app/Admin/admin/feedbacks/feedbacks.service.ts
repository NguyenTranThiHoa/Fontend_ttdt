import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Feedbacks } from './feesbacks.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class FeedbacksService {
  // private apiUrl = 'https://localhost:7253/api/Feedbacks';

  private apiUrl = `${environment.apiBaseUrl}/Feedbacks`;

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

  GetFeedbacks(): Observable<Feedbacks[]> {
    return this.http.get<Feedbacks[]>(`${this.apiUrl}/GetFeedbacks`, { headers: this.getAuthHeaders() });
  }

  ApproveFeedback(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/ApproveFeedback/ApproveFeedback/${id}`, {}, { headers: this.getAuthHeaders() });
  }

  RejectFeedback(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/RejectFeedback/RejectFeedback/${id}`, {}, { headers: this.getAuthHeaders() });
  }

  GetFeedbackStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetFeedbackStatistics/GetFeedbackStatistics`, { headers: this.getAuthHeaders() });
  }
}
