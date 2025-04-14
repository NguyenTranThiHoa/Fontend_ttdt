import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category_documents } from './categories-documents.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriesDocumentsService {
  // private apiUrl = 'https://localhost:7253/api/Category_documents';

  private apiUrl = `${environment.apiBaseUrl}/Category_documents`; // Sử dụng apiBaseUrl từ environment

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

  GetCategory_documents(): Observable<Category_documents[]> {
    return this.http.get<Category_documents[]>(`${this.apiUrl}/GetCategory_documents`, { headers: this.getAuthHeaders() });
  }

  GetCategory_documentsById(id: number): Observable<Category_documents> {
    return this.http.get<Category_documents>(`${this.apiUrl}/GetCategory_documentsById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateCategory_documents(category_documents: Category_documents): Observable<Category_documents> {
    return this.http.post<Category_documents>(`${this.apiUrl}/CreateCategory_documents`, category_documents, { headers: this.getAuthHeaders() });
  }

  UpdateCategory_documents(id: number, category_documents: Category_documents): Observable<Category_documents> {
    return this.http.put<Category_documents>(`${this.apiUrl}/UpdateCategory_documents/${id}`, category_documents, { headers: this.getAuthHeaders() });
  }

  DeleteCategory_documents(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/DeleteCategory_documents/${id}`, { headers: this.getAuthHeaders() });
  }
}
