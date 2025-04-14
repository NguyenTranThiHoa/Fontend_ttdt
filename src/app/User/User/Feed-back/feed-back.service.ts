import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class FeedBackService {
  
  // private apiUrl = 'https://localhost:7253/api/Feedbacks';

  private apiUrl = `${environment.apiBaseUrl}/Feedbacks`;

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

  /** 📌 **Tạo mới Feedback** */
  createFeedback(feedback: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/CreateFeedback`, feedback, { headers: this.getAuthHeaders() });
  }
}
