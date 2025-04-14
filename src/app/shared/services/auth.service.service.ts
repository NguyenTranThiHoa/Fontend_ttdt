// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private apiUrl = 'https://localhost:7253/api/accounts'; // Cập nhật API từ ASP.NET Core

//   constructor(private http: HttpClient) {}

//   login(credentials: { username: string; password: string }): Observable<any> {
//     return this.http.post<any>(`${this.apiUrl}/login`, credentials, {
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }
//   register(user:any): Observable<any> {
//     return this.http.post(`${this.apiUrl}/register`, user, {
//       headers: { 'Content-Type': 'application/json' },
//       responseType: 'text'
//     });
//   }

//   checkEmail(email: string): Observable<boolean> {
//     return this.http.get<boolean>(`${this.apiUrl}/check-email?email=${email}`);
//   }

//   checkUsername(username: string): Observable<boolean> {
//     return this.http.get<boolean>(`${this.apiUrl}/check-username?username=${username}`);
//   }
  
// }