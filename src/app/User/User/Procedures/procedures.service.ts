import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Procedure } from '../../../Admin/admin/procedure/procedure.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class ProceduresService {

  // private apiUrl = 'https://localhost:7253/api/Procedures';
  // private apiUrl2 = 'https://localhost:7253/api/Category_field';

  private apiUrl = `${environment.apiBaseUrl}/Procedures`;
  private apiUrl2 = `${environment.apiBaseUrl}/Category_field`;

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

  /** 📌 **Lấy danh sách tất cả thủ tục** */
  GetProcedures(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(`${this.apiUrl}/GetProcedures`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy danh sách danh mục con của danh mục cha** */
  GetCategoryHierarchy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl2}/GetCategoryHierarchy`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy thủ tục theo `id_field`** */
  GetProceduresByIdField(idField: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetProceduresByIdField/${idField}`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy chi tiết thủ tục theo `id_thutuc`** */
  GetProceduresById_thutuc(id_thutuc: string): Observable<Procedure> {
    return this.http.get<Procedure>(`${this.apiUrl}/GetProceduresById_thutuc/${id_thutuc}`, { headers: this.getAuthHeaders() });
  }
}
