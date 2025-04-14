import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { AuthService } from '../../Auth/Auth.service';
import { WebsiteSettingsService } from '../../Settings/website-settings.service';
import * as bootstrap from 'bootstrap';
import { HttpClient } from '@angular/common/http';
import { WebsiteSettings } from './website-settings.model';

import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-layouts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],
  templateUrl: './layouts.component.html',
  styleUrls: ['./layouts.component.css']
})
export class LayoutsComponent implements OnInit {
  activeItem: number | null = 0;
  isCollapsed: boolean = false;
  username: string | null = null;
  role: string | null = null;

  constructor(private router: Router, private authService: AuthService,
    private settingsService: WebsiteSettingsService,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setActiveItemBasedOnRoute(event.url);
      }
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.setBreadcrumb(event.url);
      }
    });

    this.loadUserInfo();
  }

  apiDomains: string[] = [];
  ngOnInit() {
    this.loadUserInfo();
    this.loadSettings();
    this.apiDomains = [
      'https://api.ttdt03.id.vn',
      'https://api.congtt123.id.vn',
      'https://api.ttdt2503.id.vn'
    ];
  }

  getImageWithFallback(path: string, domainIndex: number = 0): string {
    if (!path) return '';
    if (domainIndex >= this.apiDomains.length) return '';
    const safePath = path.replace(/\\/g, '/');
    return `${this.apiDomains[domainIndex]}/api/images/${safePath}`;
  }
  
  handleImageError(event: Event, imageObj: any, type: 'image') {
    imageObj.domainIndex = (imageObj.domainIndex ?? 0) + 1;
  
    if (imageObj.domainIndex < this.apiDomains.length) {
      const img = event.target as HTMLImageElement;
      this.getImageWithFallback(imageObj.path, imageObj.domainIndex)
    } else {
      console.warn(`❌ Không còn domain fallback khả dụng cho file:`, imageObj.path);
    }
  }
  
  breadcrumbs: { [key: string]: string } = {
    '/admin/app-dashboard': 'Dashboard',
    '/admin/app-categories': 'Danh mục tin tức',
    '/admin/app-news-events': 'Bài viết Tin tức',
    '/admin/app-categories-documents': 'Danh mục Văn bản - Pháp luật',
    '/admin/app-documents': 'Văn bản & Pháp luật',
    '/admin/app-categories-field': 'Danh mục Thủ tục - Hành chính',
    '/admin/app-procedure': 'Thủ tục & Hành chính',
    '/admin/app-categories-introduce': 'Giới thiệu tổng quan',
    '/admin/app-feedbacks': 'Thông tin Liên hệ',
    '/admin/app-uploadfile-image-list': 'Hình ảnh',
    '/admin/app-uploadfile-pdf-list': 'File Pdf',
    '/admin/app-accounts': 'Tài khoản',
    '/admin/app-accounts-info': 'Thông tin tài khoản'
  };

  currentBreadcrumb: string = '';
  
  setBreadcrumb(url: string) {
    this.currentBreadcrumb = this.breadcrumbs[url] || 'Trang chủ';
  }

  loadUserInfo() {
    this.username = localStorage.getItem('username') || 'Người dùng';
    this.role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (!this.username || !this.role || !token) {
      this.logout();
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  setActiveItem(index: number) {
    this.activeItem = index;
  }

  currentDateTime: string = new Date().toISOString().slice(0, 16);

  setActiveItemBasedOnRoute(url: string) {
    const routeMapping: { [key: string]: number } = {
      '/admin/app-dashboard': 0,
      '/admin/app-categories': 2,
      '/admin/app-news-events': 3,
      '/admin/app-categories-documents': 4,
      '/admin/app-documents': 5,
      '/admin/app-categories-field': 6,
      '/admin/app-procedure': 7,
      '/admin/app-categories-introduce': 8,
      '/admin/app-feedbacks': 9,
      '/admin/app-uploadfile-image-list': 10,
      '/admin/app-uploadfile-pdf-list': 11,
      '/admin/app-accounts': 12
    };
    this.activeItem = routeMapping[url] || 0;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  logout() {
    this.authService.logout(); // Xóa toàn bộ dữ liệu đăng nhập
    setTimeout(() => {
      this.router.navigate(['/auth/login']); // Chuyển hướng sau khi xóa xong
    }, 100);
  }

  isNewsEventExpanded: boolean = false;
  isDocumentsExpanded: boolean = false;

  toggleNewsEventMenu(): void {
    this.isNewsEventExpanded = !this.isNewsEventExpanded;
  }

  toggleDocumentsMenu(): void {
    this.isDocumentsExpanded = !this.isDocumentsExpanded;
  }

  /***************************************************************/

  websiteSettings: WebsiteSettings[] = [];
  
  websiteSettingsForm: WebsiteSettings = {
      id_webiste: 0,
      logoUrl: '',
      bannerUrl: '',
      websiteName: '',
      themeColor: '',
      bannerText: '',
      bannerBackgroundColor: '',
      footerBackgroundColor: '',
      footerTextColor: '',
      footerAddress: '',
      footerPhone: '',
      footerEmail: '',
      googleMapEmbedLink: '',
      menuBackgroundColor: '',
      menuTextColor: '',
      sidebarBackgroundColor: '',
      headerBackgroundColor: '',
      sidebarTextColor: '',
      headerTextColor: '',
      sidebarLayout: '',
      headerLayout: '',
      bannnerTextColor: '',
      textRunning: ''
  };
  

  saveWebsiteSettings(): void {
    console.log('Dữ liệu gửi đi:', this.websiteSettingsForm);

    this.settingsService.updateWebsiteSettings(this.websiteSettingsForm).subscribe({
        next: (response) => {
            console.log('Cập nhật thành công:', response);
            this.loadSettings(); // Load lại dữ liệu mới nhất
            this.showSuccessMessage("Cập nhật thành công!");
            this.closeModal(); // Đóng modal
        },
        error: (err) => {
            console.error('Lỗi khi cập nhật:', err);
            this.showSuccessMessage("Lỗi khi cập nhật setting: " + (err.error?.message || err.message));
        }
    });
  }

  onFileSelected(event: Event): void {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
          const formData = new FormData();
          formData.append('imageFile', file); // Trùng với tên tham số của API

          this.authService.UploadImage(formData).subscribe({
              next: (response) => {
                this.websiteSettingsForm.logoUrl = response.imagePath; // Chỉ lưu tên file
              },
              error: (err) => console.error('Lỗi tải ảnh:', err)
          });
      }
  }

  onFileSelected1(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        const formData = new FormData();
        formData.append('imageFile', file); // Trùng với tên tham số của API

        this.authService.UploadImage(formData).subscribe({
            next: (response) => {
              this.websiteSettingsForm.bannerUrl = response.imagePath; // Chỉ lưu tên file
            },
            error: (err) => console.error('Lỗi tải ảnh:', err)
        });
    }
  }


  openWebsiteSettingsModal() {
    const modal = new bootstrap.Modal(document.getElementById('websiteSettingsModal')!);
    modal.show();
  }

  closeModal() {
    const modalElement = document.getElementById('websiteSettingsModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
    }
  }


  getModalInstance(modalId: string): bootstrap.Modal | null {
      const modalElement = document.getElementById(modalId);
      return modalElement ? new bootstrap.Modal(modalElement) : null;
  }

  showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  hideModal(modal: bootstrap.Modal | null): void {
    if (modal) {
      modal.hide();
    }
  }

  successMessage: string = "";

  showSuccessMessage(message: string) {
      this.successMessage = message;
      setTimeout(() => {
          this.successMessage = "";
      }, 3000); // Tự động ẩn sau 3 giây
  }

  resetForm(): void {
    this.websiteSettingsForm = {
      id_webiste: 0,
      logoUrl: '',
      bannerUrl: '',
      websiteName: '',
      themeColor: '',
      bannerText: '',
      bannerBackgroundColor: '',
      footerBackgroundColor: '',
      footerTextColor: '',
      footerAddress: '',
      footerPhone: '',
      footerEmail: '',
      googleMapEmbedLink: '',
      menuBackgroundColor: '',
      menuTextColor: '',
      sidebarBackgroundColor: '',
      headerBackgroundColor: '',
      sidebarTextColor: '',
      headerTextColor: '',
      sidebarLayout: '',
      headerLayout: '',
      textRunning: '',
      bannnerTextColor: '',
    }
  }
  
  isEditMode = false;
  
  // Lấy dữ liệu từ API
  loadSettings(): void {
      this.authService.getWebsiteSettings().subscribe({
          next: (websiteSettings) => {
              console.log('Dữ liệu từ API:', websiteSettings);
              
              if (websiteSettings && websiteSettings.length > 0) {
                  this.websiteSettings = websiteSettings.map(settings => ({ ...settings }));
                  this.websiteSettingsForm = { ...this.websiteSettings[0] }; // Gán dữ liệu vào form
              }
          },
          error: (err) => console.error('Lỗi khi tải danh sách:', err)
      });
  }

  reloadPage(): void {
      window.location.reload();
  }

  // Mở modal
  openSettingsModal(websiteSettings: WebsiteSettings): void {
    this.isEditMode = true;
    this.websiteSettingsForm = { ...websiteSettings };
    
    console.log('Website settings trước khi mở modal:', this.websiteSettingsForm);
    
    this.showModal('websiteSettingsModal');
  }

  isSettingsOpen = false;

  isRotating = false;

  toggleSettings() {
    this.isRotating = !this.isRotating;
    this.isSettingsOpen = !this.isSettingsOpen;
  }
  /********************Thời gian*******************/
  getCurrentDateTime(): string {
    const now = new Date();
    const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16); // Lấy định dạng YYYY-MM-DDTHH:MM
    return localISOTime;
  }

}
