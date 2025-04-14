import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Procedure } from './procedure.model';
import { Categogy_field } from '../categories-procedure/categories_procedure.model';
import { Accounts } from '../../../Auth/Accounts.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class ProcedureService {
  // private apiUrlCategoryField = 'https://localhost:7253/api/Category_field';
  // private apiUrlAccounts = 'https://localhost:7253/api/Accounts';
  // private apiUrlProcedures = 'https://localhost:7253/api/Procedures';

  private apiUrlCategoryField = `${environment.apiBaseUrl}/Category_field`;
  private apiUrlAccounts = `${environment.apiBaseUrl}/Accounts`;
  private apiUrlProcedures = `${environment.apiBaseUrl}/Procedures`;

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

  GetProcedures(isVisible?: boolean): Observable<Procedure[]> {
    let url = `${this.apiUrlProcedures}/GetProcedures`;
    if (isVisible !== undefined) {
      url += `?isVisible=${isVisible}`;
    }
    return this.http.get<Procedure[]>(url, { headers: this.getAuthHeaders() });
  }

  GetCategory_field(): Observable<Categogy_field[]> {
    return this.http.get<Categogy_field[]>(`${this.apiUrlCategoryField}/GetCategory_field`, { headers: this.getAuthHeaders() });
  }

  GetAccounts(): Observable<Accounts[]> {
    return this.http.get<Accounts[]>(`${this.apiUrlAccounts}/GetAccounts`, { headers: this.getAuthHeaders() });
  }

  GetProceduresById(id: number): Observable<Procedure> {
    return this.http.get<Procedure>(`${this.apiUrlProcedures}/GetProceduresById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateProcedures(procedure: Procedure): Observable<Procedure> {
    return this.http.post<Procedure>(`${this.apiUrlProcedures}/CreateProcedures`, procedure, { headers: this.getAuthHeaders() });
  }

  UpdateProcedures(id: number, procedure: Procedure): Observable<Procedure> {
    return this.http.put<Procedure>(`${this.apiUrlProcedures}/UpdateProcedures/${id}`, procedure, { headers: this.getAuthHeaders() });
  }

  DeleteProcedures(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlProcedures}/DeleteProcedures/${id}`, { headers: this.getAuthHeaders() });
  }

  SetVisibility(id: number, isVisible: boolean): Observable<Procedure> {
    return this.http.put<Procedure>(`${this.apiUrlProcedures}/SetVisibility/SetVisibility/${id}`, isVisible, {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json')
    });
  }
}
