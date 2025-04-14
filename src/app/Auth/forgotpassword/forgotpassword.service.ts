import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForgotPasswordModel } from './forgotpassword.model';
import { VerifyResetCodeModel } from './verifyresetcode.model';

import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class ForgotpasswordService {
  // private apiUrl = 'https://localhost:7253/api/Auth';

  private apiUrl = `${environment.apiBaseUrl}/Auth`;

  constructor(private http: HttpClient) {}

  // Gửi mã xác nhận đến email
  sendResetCode(forgotPasswordData: ForgotPasswordModel): Observable<any> {
    return this.http.put(`${this.apiUrl}/ForgotPassword`, forgotPasswordData);
  }

  // Xác nhận mã và đổi mật khẩu
  verifyResetCode(verifyData: VerifyResetCodeModel): Observable<any> {
    return this.http.put(`${this.apiUrl}/VerifyResetCode/VerifyResetCode`, verifyData);
  }
}
