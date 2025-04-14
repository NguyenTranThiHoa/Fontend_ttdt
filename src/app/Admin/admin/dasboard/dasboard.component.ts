import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';  
import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { News_Events } from '../news_events/news_events.model';
import { DashboardService } from './dashboard.service';
import Chart from 'chart.js/auto';
import { ActivatedRoute } from '@angular/router'; // ✅ Import thêm ActivatedRoute

@Component({
  selector: 'app-dasboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule , NgxPaginationModule],
  templateUrl: './dasboard.component.html',
  styleUrls: ['./dasboard.component.css'] // Sửa thành styleUrls
})
export class DasboardComponent {
  new_events: News_Events[] = []; 
  
  
  constructor(
      private dashboardService: DashboardService,
      private cdr: ChangeDetectorRef,
      private httpClient: HttpClient,
      private route: ActivatedRoute // ✅ Thay vì Router, dùng ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadStatistics(); 
    this.loadTopViewedNews(3); // ✅ Hiển thị 5 bài viết xem nhiều nhất
    this.loadNewsViewsByCategory(); // ✅ Gọi hàm vẽ biểu đồ
    this.loadNewsViewsOverTime();
  }

  reloadPage(): void {
    window.location.reload();
  }
  
  statistics = {
    totalNewEvents: 0,
    totalDocuments: 0,
    totalProcedure: 0,
    totalIntroduces: 0
  };

  loadStatistics(): void {
    this.dashboardService.GetStatistics().subscribe((data: any) => {
      this.statistics = data;
      this.renderChart();
    });
  }

  renderChart(): void {
    const ctx = document.getElementById('statisticsChart') as HTMLCanvasElement;

    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Tin tức', 'Văn bản', 'Thủ tục', 'Giới thiệu'],
          datasets: [{
            data: [
              this.statistics.totalNewEvents,
              this.statistics.totalDocuments,
              this.statistics.totalProcedure,
              this.statistics.totalIntroduces
            ],
            backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0', '#FF6384'],
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  }

  formatName(name: string | null | undefined): string {
    if (!name) return "unknown-document";

    return name
      .trim()
      .toLowerCase()
      .normalize("NFD") // Chuyển ký tự có dấu thành dạng gốc (e.g., "đ" → "d̛")
      .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt
      .replace(/đ/g, "d").replace(/Đ/g, "D") // Chuyển "đ", "Đ" thành "d", "D"
      .replace(/[\/,().]/g, "-") // Thay "/", ",", ".", "(", ")" thành "-"
      .replace(/[^a-z0-9-]/g, "-") // Chỉ giữ chữ cái, số, và dấu "-"
      .replace(/-+/g, "-") // Loại bỏ dấu "-" lặp lại
      .replace(/^-+|-+$/g, ""); // Xóa dấu "-" ở đầu hoặc cuối chuỗi
  }

  newEvents: News_Events[] = [];

  loadTopViewedNews(count: number): void {
    this.dashboardService.getTopViewedNews(count).subscribe((data) => {
      this.newEvents = data;
    }, error => {
      console.error("Lỗi khi tải danh sách bài viết xem nhiều:", error);
    });
  }

  // Trả về lượt xem theo danh mục
  categoryChart: any; // Lưu trữ biểu đồ để tránh lỗi chồng biểu đồ

  loadNewsViewsByCategory(): void {
    this.dashboardService.GetNewsViewsByCategory().subscribe((data) => {
      console.log("📊 Dữ liệu API trả về:", data); // ✅ Kiểm tra dữ liệu API

      if (!data || data.length === 0) {
        console.warn("🚨 Không có dữ liệu lượt xem danh mục.");
        return;
      }

      const categories = data.map(item => item.category.trim()); // ✅ Đảm bảo không có dấu cách thừa
      const views = data.map(item => item.totalViews);

      // 🔥 Xóa biểu đồ cũ trước khi vẽ lại (tránh lỗi chồng biểu đồ)
      if (this.categoryChart) {
        this.categoryChart.destroy();
      }

      const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
      if (ctx) {
        this.categoryChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: categories,
            datasets: [{
              label: 'Lượt xem theo danh mục',
              data: views,
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      } else {
        console.error("❌ Không tìm thấy phần tử có id='categoryChart'");
      }
    }, error => {
      console.error("❌ Lỗi khi tải dữ liệu lượt xem danh mục:", error);
    });
  }

  // Số lượt xem bài viết theo ngày
  viewsOverTimeChart: any; // Lưu biểu đồ để tránh lỗi vẽ chồng

  loadNewsViewsOverTime(): void {
    this.dashboardService.GetNewsViewsOverTime().subscribe((data) => {
      console.log("📊 Dữ liệu API trả về:", data); // ✅ Kiểm tra dữ liệu API

      if (!data || data.length === 0) {
        console.warn("🚨 Không có dữ liệu lượt xem theo ngày.");
        return;
      }

      const dates = data.map(item => item.date);
      const views = data.map(item => item.totalViews);

      // 🔥 Xóa biểu đồ cũ trước khi vẽ lại (tránh lỗi chồng biểu đồ)
      if (this.viewsOverTimeChart) {
        this.viewsOverTimeChart.destroy();
      }

      const ctx = document.getElementById('viewsOverTimeChart') as HTMLCanvasElement;
      if (ctx) {
        this.viewsOverTimeChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [{
              label: 'Lượt xem theo thời gian',
              data: views,
              borderColor: '#FF6384',
              backgroundColor: 'rgba(255, 99, 132, 0.2)', // Màu nền nhẹ
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: { title: { display: true, text: "Ngày" } },
              y: { title: { display: true, text: "Lượt xem" }, beginAtZero: true }
            }
          }
        });
      } else {
        console.error("❌ Không tìm thấy phần tử có id='viewsOverTimeChart'");
      }
    }, error => {
      console.error("❌ Lỗi khi tải dữ liệu lượt xem theo ngày:", error);
    });
  }

  // Domain cho cả 2
  onImageError(event: any) {
    const brokenUrl = event.target.src;
    const fileName = brokenUrl.split('/api/images/')[1];

    if (brokenUrl.includes('ttdt2503')) {
      event.target.src = 'https://api.ttdt03.id.vn/api/images/' + fileName;
    } else {
      event.target.src = 'assets/images/no-image.png';
    }
  }

}
