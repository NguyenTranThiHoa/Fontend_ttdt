import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Documents } from '../../../Admin/admin/documents/documents.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CategogyDocService {

  // private apiUrl = 'https://localhost:7253/api/Documents';
  // private apiUrl2 = 'https://localhost:7253/api/Category_documents';

  private apiUrl = `${environment.apiBaseUrl}/Documents`;
  private apiUrl2 = `${environment.apiBaseUrl}/Category_documents`;

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

  /** 📌 **Tải file tài liệu** */
  getDocumentFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/GetDocumentFile/${id}`, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    });
  }

  /** 📌 **Lấy danh sách tài liệu theo danh mục** */
  getDocByCategory(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetDocByNameCategory/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tên danh mục từ ID** */
  getCategoryNameById(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl2}/GetCategory_documentsById/${categoryId}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy danh mục con theo tên danh mục cha** */
  getSubcategoriesByName(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl2}/GetAllSubCat_DocumentNamesByName/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy 5 văn bản mới nhất theo danh mục** */
  GetTop5DocByCategory(id: number): Observable<Documents[]> {
    return this.http.get<Documents[]>(`${this.apiUrl}/GetTop5LatestDocByCategory/${id}`, { headers: this.getAuthHeaders() });
  }

  ///////// **Dùng trong trang chi tiết văn bản** /////////

  /** 📌 **Lấy tài liệu theo tên** */
  GetDocByName(name: string): Observable<Documents> {
    return this.http.get<Documents>(`${this.apiUrl}/GetDocByName/${name}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tài liệu liên quan** */
  GetRelatedDoc(id: number): Observable<Documents[]> {
    return this.http.get<Documents[]>(`${this.apiUrl}/GetRelatedDoc/${id}`, { headers: this.getAuthHeaders() });
  }
}
