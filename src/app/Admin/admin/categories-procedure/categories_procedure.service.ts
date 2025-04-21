import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categogy_field } from './categories_procedure.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriesFieldeService {

  private apiUrl = `${environment.apiBaseUrl}/Category_field`;

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

  GetCategory_field(): Observable<Categogy_field[]> {
    return this.http.get<Categogy_field[]>(`${this.apiUrl}/GetCategory_field`, { headers: this.getAuthHeaders() });
  }

  GetCategory_fieldById(id: number): Observable<Categogy_field> {
    return this.http.get<Categogy_field>(`${this.apiUrl}/GetCategory_fieldById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateCategory_field(categories: Categogy_field): Observable<Categogy_field> {
    return this.http.post<Categogy_field>(`${this.apiUrl}/CreateCategory_field`, categories, { headers: this.getAuthHeaders() });
  }

  UpdateCategory_field(id: number, categories_field: Categogy_field): Observable<Categogy_field> {
    return this.http.put<Categogy_field>(`${this.apiUrl}/UpdateCategory_field/${id}`, categories_field, { headers: this.getAuthHeaders() });
  }

  DeleteCategory_field(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/DeleteCategory_field/${id}`, { headers: this.getAuthHeaders() });
  }
}
