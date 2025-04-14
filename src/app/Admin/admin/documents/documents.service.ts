import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Documents } from './documents.model';
import { Category_documents } from '../categories-documents/categories-documents.model';
import { Accounts } from '../../../Auth/Accounts.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  // private apiUrl1 = 'https://localhost:7253/api/Category_documents';
  // private apiUrl2 = 'https://localhost:7253/api/Accounts';
  // private apiUrl = 'https://localhost:7253/api/Documents';

  private apiUrl1 = `${environment.apiBaseUrl}/Category_documents`;
  private apiUrl2 = `${environment.apiBaseUrl}/Accounts`;
  private apiUrl = `${environment.apiBaseUrl}/Documents`;

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

  GetDocuments(isVisible?: boolean): Observable<Documents[]> {
    let url = `${this.apiUrl}/GetDocuments`;
    if (isVisible !== undefined) {
      url += `?isVisible=${isVisible}`;
    }
    return this.http.get<Documents[]>(url, { headers: this.getAuthHeaders() });
  }

  GetCategory_documents(): Observable<Category_documents[]> {
    return this.http.get<Category_documents[]>(`${this.apiUrl1}/GetCategory_documents`, { headers: this.getAuthHeaders() });
  }

  GetAccounts(): Observable<Accounts[]> {
    return this.http.get<Accounts[]>(`${this.apiUrl2}/GetAccounts`, { headers: this.getAuthHeaders() });
  }

  GetDocumentsById(id: number): Observable<Documents> {
    return this.http.get<Documents>(`${this.apiUrl}/GetDocumentsById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateDocuments(documents: Documents): Observable<Documents> {
    return this.http.post<Documents>(`${this.apiUrl}/CreateDocuments`, documents, { headers: this.getAuthHeaders() });
  }

  UpdateDocuments(id: number, documents: Documents): Observable<Documents> {
    return this.http.put<Documents>(`${this.apiUrl}/UpdateDocuments/${id}`, documents, { headers: this.getAuthHeaders() });
  }

  DeleteDocuments(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/DeleteDocuments/${id}`, { headers: this.getAuthHeaders() });
  }

  UploadPdfDocument(pdfFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdfFile', pdfFile, pdfFile.name);

    return this.http.post<any>(`${this.apiUrl}/UploadPdfDocument`, formData, { headers: this.getAuthHeaders() });
  }

  downloadFile(id: number): void {
    window.open(`https://localhost:7253/api/images/${id}`, '_blank');
  }

  // SetVisibility(id: number, isVisible: boolean): Observable<Documents> {
  //   return this.http.put<Documents>(`${this.apiUrl}/SetVisibility/SetVisibility/${id}`, { isVisible }, { headers: this.getAuthHeaders() });
  // }

  SetVisibility(id: number, isVisible: boolean): Observable<Documents> {
    return this.http.put<Documents>(`${this.apiUrl}/SetVisibility/SetVisibility/${id}`, isVisible, {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json')
    });
  }

}
