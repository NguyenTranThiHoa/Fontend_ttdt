import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { News_Events } from '../../../Admin/admin/news_events/news_events.model';
import { Introduce } from '../../../Admin/admin/categories-introduce/introduce.model';
import { Documents } from '../../../Admin/admin/documents/documents.model';
import { Procedure } from '../../../Admin/admin/procedure/procedure.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // private apiUrl = 'https://localhost:7253/api/Introduce';
  // private apiUrl2 = 'https://localhost:7253/api/News_events';
  // private apiUrl3 = 'https://localhost:7253/api/Documents';
  // private apiUrl4 = 'https://localhost:7253/api/Procedures';

  // private apiUrlcate = 'https://localhost:7253/api/Categories_introduce';
  // private apiUrlcate2 = 'https://localhost:7253/api/Categories';
  // private apiUrlcate3 = 'https://localhost:7253/api/Category_documents';
  // private apiUrlcate4 = 'https://localhost:7253/api/Category_field';

  private apiUrl = `${environment.apiBaseUrl}/Introduce`;
  private apiUrl2 = `${environment.apiBaseUrl}/News_events`;
  private apiUrl3 = `${environment.apiBaseUrl}/Documents`;
  private apiUrl4 = `${environment.apiBaseUrl}/Procedures`;

  private apiUrlcate = `${environment.apiBaseUrl}/Categories_introduce`;
  private apiUrlcate2 = `${environment.apiBaseUrl}/Categories`;
  private apiUrlcate3 = `${environment.apiBaseUrl}/Category_documents`;
  private apiUrlcate4 = `${environment.apiBaseUrl}/Category_field`;

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

  /** 📌 **Lấy danh sách Giới thiệu** */
  GetIntroduce(): Observable<Introduce[]> {
    return this.http.get<Introduce[]>(`${this.apiUrl}/GetIntroduce`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy danh sách Tin tức - Sự kiện** */
  GetNews_Events(): Observable<News_Events[]> {
    return this.http.get<News_Events[]>(`${this.apiUrl2}/GetNews_Events`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy danh sách Văn bản** */
  GetDocuments(): Observable<Documents[]> {
    return this.http.get<Documents[]>(`${this.apiUrl3}/GetDocuments`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy danh sách Thủ tục** */
  GetProcedures(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(`${this.apiUrl4}/GetProcedures`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tên danh mục Giới thiệu theo ID** */
  getCategoryNameIntroById(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlcate}/GetCategoryById/${categoryId}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tên danh mục Tin tức theo ID** */
  getCategoryNameById(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlcate2}/GetCategoryById/${categoryId}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tên danh mục Văn bản theo ID** */
  getCategoryNameDocById(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlcate3}/GetCategoryById/${categoryId}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tên danh mục Thủ tục theo ID** */
  getCategoryNameFieldById(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlcate4}/GetCategoryById/${categoryId}`, { headers: this.getAuthHeaders() });
  }
}
