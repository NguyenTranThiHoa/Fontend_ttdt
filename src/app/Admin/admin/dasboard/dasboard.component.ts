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
    this.loadTopViewedNews(4); // ✅ Hiển thị 5 bài viết xem nhiều nhất
    this.loadNewsViewsByCategory(); // ✅ Gọi hàm vẽ biểu đồ
    this.loadNewsViewsOverTime();

    this.apiDomains = [
      'https://api.ttdt2503.id.vn',
      'https://api.ttdt03.id.vn',
      'https://api.congtt123.id.vn',
    ]
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

  // renderChart(): void {
  //   const ctx = document.getElementById('statisticsChart') as HTMLCanvasElement;
  //   const legendContainer = document.getElementById('statisticsLegend');

  //   if (ctx) {
  //     const chart = new Chart(ctx, {
  //       type: 'doughnut',
  //       data: {
  //         labels: ['Tin tức', 'Văn bản', 'Thủ tục', 'Giới thiệu'],
  //         datasets: [{
  //           data: [
  //             this.statistics.totalNewEvents,
  //             this.statistics.totalDocuments,
  //             this.statistics.totalProcedure,
  //             this.statistics.totalIntroduces
  //           ],
  //           backgroundColor: [
  //             '#D1FAE5', // $green-200
  //             '#FEF9C3', // $yellow-200
  //             '#FECACA', // $red-200
  //             '#DBEAFE'  // $blue-200
  //           ],
  //           borderWidth: 1,
  //           hoverOffset: 6
  //         }]
  //       },
  //       options: {
  //         responsive: false,
  //         plugins: {
  //           legend: { display: false } // tắt mặc định
  //         },
  //         animation: { duration: 0 }
  //       }
  //     });

  //     const backgroundColors = chart.data.datasets[0].backgroundColor as string[];

  //     if (legendContainer) {
  //       legendContainer.innerHTML = chart.data.labels!.map((label, i) => `
  //         <div>
  //           <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background-color:${backgroundColors[i]};margin-right:6px;"></span>
  //           ${label}
  //         </div>
  //       `).join('');
  //     }
  //   }
  // }

  renderChart(): void {
    const ctx = document.getElementById('statisticsChart') as HTMLCanvasElement;
    const legendContainer = document.getElementById('statisticsLegend');

    const total = this.statistics.totalNewEvents +
                  this.statistics.totalDocuments +
                  this.statistics.totalProcedure +
                  this.statistics.totalIntroduces;

    // Plugin hiển thị số tổng ở trung tâm biểu đồ
    const centerTextPlugin = {
      id: 'centerText',
      beforeDraw: function(chart: any) {
        const { width, height } = chart;
        const ctx = chart.ctx;
        ctx.restore();
        const fontSize = (height / 130).toFixed(2);
        ctx.font = `${fontSize}em sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1E3A8A'; // Màu chữ
        const text = total.toString();
        const textX = Math.round((width - ctx.measureText(text).width) / 2);
        const textY = height / 2;
        ctx.fillText(text, textX, textY);
        ctx.save();
      }
    };

    if (ctx) {
      const chart = new Chart(ctx, {
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
            backgroundColor: [
              '#D1FAE5', // green-200
              '#FEF9C3', // yellow-200
              '#FECACA', // red-200
              '#DBEAFE'  // blue-200
            ],
            borderWidth: 1,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: false,
          plugins: {
            legend: { display: false }
          },
          animation: { duration: 0 }
        },
        plugins: [centerTextPlugin]  // Chỉ dùng plugin hiển thị tổng số ở giữa
      });

      const backgroundColors = chart.data.datasets[0].backgroundColor as string[];

      if (legendContainer) {
        const data = chart.data.datasets[0].data as number[];

        legendContainer.innerHTML = chart.data.labels!.map((label, i) => {
          const value = data[i];
          const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          return `
            <div>
              <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background-color:${backgroundColors[i]};margin-right:6px;"></span>
              ${label}
              <span>${value}</span> 
              <span>(${percent}%)</span>
            </div>
          `;
        }).join('');
      }
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
              backgroundColor: ['rgba(64, 81, 137, 0.85)'],
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
    console.log("📊 Dữ liệu API trả về:", data);

    if (!data || data.length === 0) {
      console.warn("🚨 Không có dữ liệu lượt xem theo ngày.");
      return;
    }

    const dates = data.map(item => item.date);
    const newsViews = data.map(item => item.totalViewsNews);
    const docViews = data.map(item => item.totalViewsDocs);

    if (this.viewsOverTimeChart) {
      this.viewsOverTimeChart.destroy();
    }

    const ctx = document.getElementById('viewsOverTimeChart') as HTMLCanvasElement;
    if (ctx) {
      this.viewsOverTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Tin tức',
              data: newsViews,
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#3B82F6'
            },
            {
              label: 'Văn bản',
              data: docViews,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#10B981'
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: "Ngày" } },
            y: { title: { display: true, text: "Lượt xem" }, beginAtZero: true }
          },
          animation: {
            duration: 1500,
            easing: 'easeOutQuart'
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



  /*************************************************/
  // Hiện ra doamin cho cả 3
  apiDomains: string[] = [];

  getSafeImagePath(imagePath: string): string {
    return imagePath.replace(/\\/g, "/"); // Đảm bảo đúng định dạng URL
  }

  getImageWithFallback(imagePath: string, domainIndex: number = 0): string {
    const safePath = this.getSafeImagePath(imagePath);
    const domain = this.apiDomains[domainIndex] || this.apiDomains[0];
    return `${domain}/api/images/${safePath}`;
  }

  getImageUrlWithFallback(obj: any, field: string): string {
    const domainIndex = obj.domainIndex ?? 0;
    return this.getImageWithFallback(obj[field], domainIndex);
  }

  handleImageError1(event: Event, obj: any, field: string): void {
    if (obj.domainIndex === undefined || obj.domainIndex === null) {
      obj.domainIndex = 0; // Gán lần đầu
    }
  
    obj.domainIndex++;
  
    if (obj.domainIndex < this.apiDomains.length) {
      const target = event.target as HTMLImageElement;
      target.src = this.getImageWithFallback(obj[field], obj.domainIndex);
    } else {
      console.warn('❌ Không còn domain fallback khả dụng cho ảnh:', obj[field]);
    }
  }

}
