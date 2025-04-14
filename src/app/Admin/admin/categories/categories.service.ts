// <!----------------------------File sửa đổi chỗ xóa nhiều và xóa từng một cái danh sách------------------------>
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categories } from './categories.component.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  private apiUrl = `${environment.apiBaseUrl}/Categories`; // Sử dụng apiBaseUrl từ environment

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("🚨 Không có token, API sẽ bị lỗi 401!");
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  GetCategories(): Observable<Categories[]> {
    return this.http.get<Categories[]>(`${this.apiUrl}/GetCategories`, { headers: this.getAuthHeaders() });
  }

  GetCategoriesById(id: number): Observable<Categories> {
    return this.http.get<Categories>(`${this.apiUrl}/GetCategoriesById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateCategories(categories: Categories): Observable<Categories> {
    return this.http.post<Categories>(`${this.apiUrl}/CreateCategories`, categories, { headers: this.getAuthHeaders() });
  }

  UpdateCategories(id: number, categories: Categories): Observable<Categories> {
    return this.http.put<Categories>(`${this.apiUrl}/UpdateCategories/${id}`, categories, { headers: this.getAuthHeaders() });
  }

  DeleteCategory(id: number): Observable<void> { // Xóa từng danh mục
    return this.http.delete<void>(`${this.apiUrl}/DeleteCategory/${id}`, { headers: this.getAuthHeaders() });
  }

  DeleteCategories(ids: number[]): Observable<void> { // Xóa nhiều danh mục
    return this.http.delete<void>(`${this.apiUrl}/DeleteCategories`, { body: ids, headers: this.getAuthHeaders() });
  }
}

