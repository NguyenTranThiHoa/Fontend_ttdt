import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostImage } from './postImage.model';
import { Folder } from './folder.model';

import { environment } from '../../../../environment';

@Injectable({
  providedIn: 'root'
})
export class UploadfileImageService {
  // private apiUrlImage = 'https://localhost:7253/api/UploadFile';
  // private apiUrlFolder = 'https://localhost:7253/api/Folder';

  private apiUrlImage = `${environment.apiBaseUrl}/UploadFile`;
  private apiUrlFolder = `${environment.apiBaseUrl}/Folder`;

  constructor(private http: HttpClient) {}

  // 🔥 **Thêm Authorization vào Header**
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("🚨 Không có token, API sẽ bị lỗi 401!");
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** 📌 **Ảnh** */
  GetImages(): Observable<PostImage[]> {
    return this.http.get<PostImage[]>(`${this.apiUrlImage}/GetImages`, { headers: this.getAuthHeaders() });
  }

  MoveImage(id: number, targetFolderId: number): Observable<PostImage> {
    return this.http.put<PostImage>(
      `${this.apiUrlImage}/MoveImage/MoveImage/${id}?targetFolderId=${targetFolderId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  UpdatePostImage(id: number, postImage: PostImage): Observable<PostImage> {
    return this.http.put<PostImage>(`${this.apiUrlImage}/UpdatePostImage/${id}`, postImage, { headers: this.getAuthHeaders() });
  }

  DeletePostImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlImage}/DeletePostImage/${id}`, { headers: this.getAuthHeaders() });
  }

  // 📌 **Upload ảnh**
  uploadImage(file: File, folderId: number | null): Observable<PostImage> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId !== null) {
      formData.append('folderId', folderId.toString());
    }
    return this.http.post<PostImage>(`${this.apiUrlImage}/UploadImage/UploadImage`, formData, { headers: this.getAuthHeaders() });
  }

  // 📌 **Cập nhật ảnh kèm metadata**
  updateImageWithMetadata(id: number, file: File): Observable<PostImage> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<PostImage>(`${this.apiUrlImage}/UpdateImageWithMetadata/${id}`, formData, { headers: this.getAuthHeaders() });
  }

  /****************************************************/
  /** 📂 **Thư mục ảnh** */
  GetFolder(): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.apiUrlFolder}/GetFolder`, { headers: this.getAuthHeaders() });
  }

  GetFolderById(id: number): Observable<Folder> {
    return this.http.get<Folder>(`${this.apiUrlFolder}/GetFolderById/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateFolder(folder: Folder): Observable<Folder> {
    return this.http.post<Folder>(`${this.apiUrlFolder}/CreateFolder`, folder, { headers: this.getAuthHeaders() });
  }

  UpdateFolder(id: number, folder: Folder): Observable<Folder> {
    return this.http.put<Folder>(`${this.apiUrlFolder}/UpdateFolder/${id}`, folder, { headers: this.getAuthHeaders() });
  }

  DeleteFolder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlFolder}/DeleteFolder/${id}`, { headers: this.getAuthHeaders() });
  }
}
