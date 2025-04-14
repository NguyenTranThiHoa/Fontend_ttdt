import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class IntroduceService {

  // private apiUrl = 'https://localhost:7253/api/Introduce';
  // private apiUrl2 = 'https://localhost:7253/api/Categories_introduce';

  private apiUrl = `${environment.apiBaseUrl}/Introduce`;
  private apiUrl2 = `${environment.apiBaseUrl}/Categories_introduce`;
    
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

  /** 📌 **Lấy bài giới thiệu theo danh mục** */
  GetIntroByNameCategogy(nameCate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetIntroByNameCategogy/${nameCate}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy bài giới thiệu theo tên** */
  GetIntroByName(nameIntro: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetIntroByName/${nameIntro}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy bài viết giới thiệu liên quan** */
  GetRelatedIntroduce(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetRelatedIntroduce/${id}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy thông tin danh mục giới thiệu theo ID** */
  GetCategories_introducesById(id: number): Observable<{ id_cate_introduce: number, name_cate_introduce: string }> {
    return this.http.get<{ id_cate_introduce: number, name_cate_introduce: string }>(
      `${this.apiUrl2}/GetCategories_introducesById/${id}`, 
      { headers: this.getAuthHeaders() }
    );
  }
}
