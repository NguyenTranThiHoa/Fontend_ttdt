import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categories_introduce } from './categories-introduce.model';
import { Introduce } from './introduce.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriesIntroduceService {
  // private apiUrl = 'https://localhost:7253/api/Categories_introduce';
  // private apiUrl1 = 'https://localhost:7253/api/Introduce';

  private apiUrl = `${environment.apiBaseUrl}/Categories_introduce`;
  private apiUrl1 = `${environment.apiBaseUrl}/Introduce`;

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

  /** ===================== CATEGORIES INTRODUCE ===================== **/
  GetCategories_introduces(): Observable<Categories_introduce[]> {
    return this.http.get<Categories_introduce[]>(`${this.apiUrl}/GetCategories_introduces`, { headers: this.getAuthHeaders() });
  }

  GetCategories_introducesById(id: number): Observable<Categories_introduce> {
    return this.http.get<Categories_introduce>(`${this.apiUrl}/GetCategories_introduces/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateCategories_introduces(categories_introduce: Categories_introduce): Observable<Categories_introduce> {
    return this.http.post<Categories_introduce>(`${this.apiUrl}/CreateCategories_introduces`, categories_introduce, { headers: this.getAuthHeaders() });
  }

  UpdateCategories_introduces(id: number, categories_introduce: Categories_introduce): Observable<Categories_introduce> {
    return this.http.put<Categories_introduce>(`${this.apiUrl}/UpdateCategories_introduces/${id}`, categories_introduce, { headers: this.getAuthHeaders() });
  }

  DeleteCategories_introduces(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/DeleteCategories_introduces/${id}`, { headers: this.getAuthHeaders() });
  }

  /** ===================== INTRODUCE ===================== **/
  GetIntroduce(): Observable<Introduce[]> {
    return this.http.get<Introduce[]>(`${this.apiUrl1}/GetIntroduce`, { headers: this.getAuthHeaders() });
  }

  GetIntroduceById(id: number): Observable<Introduce> {
    return this.http.get<Introduce>(`${this.apiUrl1}/GetIntroduceById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateIntroduce(introduce: Introduce): Observable<Introduce> {
    return this.http.post<Introduce>(`${this.apiUrl1}/CreateIntroduce`, introduce, { headers: this.getAuthHeaders() });
  }

  UpdateIntroduce(id: number, introduce: Introduce): Observable<Introduce> {
    return this.http.put<Introduce>(`${this.apiUrl1}/UpdateIntroduce/${id}`, introduce, { headers: this.getAuthHeaders() });
  }

  DeleteIntroduce(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl1}/DeleteIntroduce/${id}`, { headers: this.getAuthHeaders() });
  }

  UploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl1}/UploadImage/upload-image`, formData, { headers: this.getAuthHeaders() });
  }
}
