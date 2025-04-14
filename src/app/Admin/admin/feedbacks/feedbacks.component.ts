import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';  
import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Feedbacks } from './feesbacks.model';
import { FeedbacksService } from './feedbacks.service';
import * as bootstrap from 'bootstrap';


@Component({
  selector: 'app-feedbacks',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule , NgxPaginationModule],
  templateUrl: './feedbacks.component.html',
  styleUrl: './feedbacks.component.css'
})
export class FeedbacksComponent {

  feedbacks: Feedbacks[] = []; 
   
  selectedFeedback: Feedbacks | null = null; 

  feedbacksForm: Feedbacks = { 
    id_feedbacks: 0, 
    fullname: '', 
    email: '',
    content: '',
    received_at: '',
    phone: '',
    status: '',
    selected: false,
  };

  isEditMode = false;
  successMessage = '';
  page: number = 1;
  pageSize: number = 5;
  searchQuery: string = '';
  
  constructor(
      private feedbacksService: FeedbacksService,
      private cdr: ChangeDetectorRef,
      private httpClient: HttpClient,
  ) { }

  ngOnInit(): void {
    this.loadCFeedbacks();
    this.loadStatistics(); 
  }

  reloadPage(): void {
    window.location.reload();
  }

  loadCFeedbacks(): void {
      this.feedbacksService.GetFeedbacks().subscribe(categories => {
          this.feedbacks = categories;
          console.log("Dữ liệu phản hồi từ API:", this.feedbacks);
          this.cdr.detectChanges(); // ✅ Ép Angular cập nhật giao diện
      });
  }

  loadStatistics(): void {
    this.feedbacksService.GetFeedbackStatistics().subscribe(data => {
      this.statistics = data;
    });
  }

  // Logic lọc dữ liệu
  get filteredFeedbacks(): Feedbacks[] {
      let filtered = [...this.feedbacks];

      // Lọc theo trạng thái
      if (this.selectedStatus) {
        filtered = filtered.filter(fb => fb.status === this.selectedStatus);
    }
    
      // Lọc theo tìm kiếm
      if (this.searchQuery) {
        filtered = filtered.filter(procedure =>
          (procedure.fullname?.toLowerCase() || '').includes(this.searchQuery.toLowerCase())
        );
        console.log('Dữ liệu sau khi lọc tìm kiếm:', filtered);
    }
    return filtered;
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredFeedbacks.length / this.pageSize);
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  approveFeedback(id: number): void {
    this.feedbacksService.ApproveFeedback(id).subscribe(response => {
        const feedback = this.feedbacks.find(f => f.id_feedbacks === id);
        if (feedback) {
            feedback.status = "Approved"; // ✅ Đã duyệt
        }
    });
  }

  rejectFeedback(id: number): void {
      this.feedbacksService.RejectFeedback(id).subscribe(response => {
          const feedback = this.feedbacks.find(f => f.id_feedbacks === id);
          if (feedback) {
              feedback.status = "Rejected"; // ❌ Từ chối
          }
      });
  }

   // Hàm mở modal và hiển thị chi tiết
  viewDetail(feedback: Feedbacks): void {
    this.selectedFeedback = feedback;
    const modal = new bootstrap.Modal(document.getElementById('detailModal')!);
    modal.show();
  }

  getGmailLink(): string {
    if (!this.selectedFeedback) return '#';

    const email = this.selectedFeedback.email;
    const subject = 'Phản hồi về liên hệ';
    const body = `Chào ${this.selectedFeedback.fullname},

  (Nội dung email phản hồi tại đây...)`;

    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}
            &su=${encodeURIComponent(subject)}
            &body=${encodeURIComponent(body)}`;
  }

  statistics = {
    totalFeedbacks: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0
  };
  
  selectedStatus: string = '';

  filterByStatus(): void {
    this.page = 1; // Reset về trang đầu
    this.cdr.detectChanges(); // Cập nhật giao diện
  }
}
