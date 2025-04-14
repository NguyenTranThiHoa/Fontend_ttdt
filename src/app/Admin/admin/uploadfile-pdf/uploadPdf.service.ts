import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostPdf } from './postPdf.model';
import { FolderPdf } from './folder-pdf.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class UploadPdfService {

  private apiUrlPdf = `${environment.apiBaseUrl}/UploadFilePdf`;
  private apiUrlFolderPdf = `${environment.apiBaseUrl}/FolderPdf`;

  constructor(private http: HttpClient) {}

  // 🔥 Thêm Authorization vào Header
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("🚨 Không có token, API sẽ bị lỗi 401!");
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  GetPdf(): Observable<PostPdf[]> {
    return this.http.get<PostPdf[]>(`${this.apiUrlPdf}/GetPdf`, { headers: this.getAuthHeaders() });
  }

  MovePdf(id: number, targetFolderId: number): Observable<PostPdf> {
    return this.http.put<PostPdf>(
      `${this.apiUrlPdf}/MovePdf/MovePdf/${id}?targetFolderId=${targetFolderId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  UpdatePostPdf(id: number, postPdf: PostPdf): Observable<PostPdf> {
    return this.http.put<PostPdf>(`${this.apiUrlPdf}/UpdatePostPdf/${id}`, postPdf, { headers: this.getAuthHeaders() });
  }

  DeletePostPdf(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlPdf}/DeletePostPdf/${id}`, { headers: this.getAuthHeaders() });
  }

  // Upload PDF
  uploadPdf(file: File, folderId: number | null): Observable<PostPdf> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId !== null) {
      formData.append('folderId', folderId.toString());
    }
    return this.http.post<PostPdf>(`${this.apiUrlPdf}/UploadPdf/UploadPdf`, formData, { headers: this.getAuthHeaders() });
  }


  // Cập nhật ảnh kèm metadata
  updateImageWithMetadata(id: number, file: File): Observable<PostPdf> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<PostPdf>(`${this.apiUrlPdf}/UpdateImageWithMetadata/${id}`, formData, { headers: this.getAuthHeaders() });
  }

  /****************************************************/
  // 📂 **Folder PDF**
  GetFolderPdf(): Observable<FolderPdf[]> {
    return this.http.get<FolderPdf[]>(`${this.apiUrlFolderPdf}/GetFolderPdf`, { headers: this.getAuthHeaders() });
  }

  GetFolderPdfById(id: number): Observable<FolderPdf> {
    return this.http.get<FolderPdf>(`${this.apiUrlFolderPdf}/GetFolderPdfById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateFolderPdf(folder: FolderPdf): Observable<FolderPdf> {
    return this.http.post<FolderPdf>(`${this.apiUrlFolderPdf}/CreateFolderPdf`, folder, { headers: this.getAuthHeaders() });
  }

  UpdateFolderPdf(id: number, folder: FolderPdf): Observable<FolderPdf> {
    return this.http.put<FolderPdf>(`${this.apiUrlFolderPdf}/UpdateFolderPdf/${id}`, folder, { headers: this.getAuthHeaders() });
  }

  DeleteFolderPdf(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlFolderPdf}/DeleteFolderPdf/${id}`, { headers: this.getAuthHeaders() });
  }
}
