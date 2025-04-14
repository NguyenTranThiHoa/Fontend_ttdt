import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Accounts } from '../../../Auth/Accounts.model';
import { AssignPermissions } from './assignPermissions.model';
import { environment } from '../../../../environment';


@Injectable({
  providedIn: 'root',
})
export class AccountsService {
  // private apiUrl = 'https://localhost:7253/api/Auth';
   private apiUrl = `${environment.apiBaseUrl}/Auth`;  // Sử dụng apiBaseUrl từ environment

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

  /** 📌 **Lấy danh sách tài khoản** */
  GetAccounts(): Observable<Accounts[]> {
    return this.http.get<Accounts[]>(`${this.apiUrl}/GetAccounts`, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Lấy tài khoản theo ID** */
  GetAccountsById(id: number): Observable<Accounts> {
    return this.http.get<Accounts>(`${this.apiUrl}/GetAccountsById/${id}`, { headers: this.getAuthHeaders() });
  }

  DisableAccount(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/DisableAccount/${id}`, {}, { headers: this.getAuthHeaders() });
  }

  UpgradeToAdmin(accountId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/AssignAdminRole/${accountId}`, {}, { headers: this.getAuthHeaders() });
  }

  /** 📌 **Gửi quyền hạn lên Server** */
  getPermissionsByManagerId(managerId: number): Observable<AssignPermissions> {
    return this.http.get<AssignPermissions>(`${this.apiUrl}/GetManagerPermissions/GetManagerPermissions/${managerId}`, { headers: this.getAuthHeaders() });
  }

  assignPermissions(model: AssignPermissions): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/AssignManagerPermissions`, model, { headers: this.getAuthHeaders() });
  }

  UpdateAccount(id: number, accounts: Accounts): Observable<Accounts> {
    return this.http.put<Accounts>(`${this.apiUrl}/UpdateAccount/${id}`, accounts, { headers: this.getAuthHeaders() });
  }

  UpdatePassword(data: { id_account: number; oldPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/UpdatePassword`, data, { headers: this.getAuthHeaders() });
  }

  /*******************Xóa tài khoản*******************/
  DeleteAccount(accountId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/DeleteAccount/${accountId}`, { headers: this.getAuthHeaders() });
  }
}
