import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedBackService } from './feed-back.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { UserLayoutService } from '../../user-layout/user-layout.service';
import { WebsiteSettings } from '../../../Admin/Admin_Layouts/website-settings.model';

@Component({
  selector: 'app-feed-back',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './feed-back.component.html',
  styleUrl: './feed-back.component.css'
})
export class FeedBackComponent implements OnInit{

  feedbackForm!: FormGroup;
  successMessage = '';
  isSubmitted = false;

  
  websiteSettings: WebsiteSettings | null = null; 
  safeGoogleMapEmbedLink: SafeHtml | null = null;
  
  constructor(
    private fb: FormBuilder, 
    private feedbackService: FeedBackService, 
    private userlayoutService: UserLayoutService,
    private sanitizer: DomSanitizer,
    private titleService: Title, private metaService: Meta) 
    {
      this.feedbackForm = this.fb.group({
        fullname: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern('^0[0-9]{9}$')]],
        email: ['', [Validators.required, Validators.email]],
        content: ['', Validators.required],
        received_at: [new Date().toISOString()]
      });
    }

  ngOnInit(): void {
    this.titleService.setTitle('Liên hệ');
    this.loadSettings();
  }

  //setting
  loadSettings(): void {
    this.userlayoutService.getWebsiteSettings().subscribe({
      next: (settings: WebsiteSettings[]) => {
        console.log("Dữ liệu từ API:", settings);
        
        if (settings.length > 0) {
          this.websiteSettings = settings[0]; // Lấy phần tử đầu tiên của mảng
          // Lưu trữ iframe vào biến an toàn
          this.safeGoogleMapEmbedLink = this.sanitizer.bypassSecurityTrustHtml(this.websiteSettings?.googleMapEmbedLink || '');

        }
      },
      error: (err) => console.error("Lỗi khi tải danh sách:", err),
    });
  }

  submitFeedback() {
    this.isSubmitted = true;

    if (this.feedbackForm.invalid) {
      console.log('Form không hợp lệ:', this.feedbackForm.value);
      console.log('Chi tiết lỗi:', this.feedbackForm.errors);

      Object.keys(this.feedbackForm.controls).forEach(field => {
        const control = this.feedbackForm.get(field);
        if (control) {
          control.markAsTouched();
          control.updateValueAndValidity(); // Cập nhật lỗi ngay lập tức
        }
      });
      return;
    }

    if (this.feedbackForm.valid) {
      this.feedbackForm.patchValue({
        received_at: new Date().toISOString()
      });
  
      this.feedbackService.createFeedback(this.feedbackForm.value).subscribe({
        next: (response) => {
          this.successMessage = 'Phản hồi của bạn đã được gửi thành công!';
  
          // Reset các trường nhập liệu sau khi gửi thành công
          this.feedbackForm.reset();
          this.isSubmitted = false;
  
          // Ẩn thông báo sau 3 giây
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Lỗi gửi phản hồi:', error);
        },
      });
    } 
  }
  
}
