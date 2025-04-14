import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ViewChild } from '@angular/core';
import { WebsiteSettings } from './app/Admin/Admin_Layouts/website-settings.model';
import { UserLayoutService } from './app/User/user-layout/user-layout.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HttpClientModule, FormsModule, ReactiveFormsModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] 
})
export class AppComponent implements OnInit {
  websiteSettings: WebsiteSettings | null = null; 

  constructor(
    private userlayoutService: UserLayoutService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }
    
  loadSettings(): void {
    this.userlayoutService.getWebsiteSettings().subscribe({
      next: (settings: WebsiteSettings[]) => {
        console.log("Dữ liệu từ API:", settings);
        
        if (settings.length > 0) {
          this.websiteSettings = settings[0]; // Lấy phần tử đầu tiên của mảng
          // Cập nhật tiêu đề trang sau khi nhận được dữ liệu từ API
          this.titleService.setTitle(this.websiteSettings.websiteName || 'Trang thông tin điện tử');
        }
      },
      error: (err) => console.error("Lỗi khi tải danh sách:", err),
    });
  }
}