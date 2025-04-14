import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CategoriesService } from '../categories.service';
import { News_Events } from '../../../../Admin/admin/news_events/news_events.model';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule] ,
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css']
})
export class CategoryDetailComponent implements OnInit {

  newsDetail!: News_Events;
  relatedNews: News_Events[] = []; // Biến để lưu trữ bài viết liên quan
  currentPage: number = 1;
  itemsPerPage: number = 8; // Số bài viết trên mỗi trang
  Top5LatestNewsByCate: News_Events[] = []; // Top 5 news
  fontSize: number = 16;
  categoryName: string = '';
  NewsName: string = '';
  formattedCategoryNew_EventName: string = '';
  formattedNewsName : string = '';
  formatted: string='';
  nameCategoryNewsOrigin: string = '';

  backLink: string = '../';

  constructor(
    private route: ActivatedRoute,
    private categoriesService: CategoriesService,
    private cdRef: ChangeDetectorRef,
    private location: Location,    
    private titleService: Title, private metaService: Meta

  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoryName = decodeURIComponent(params.get('name') || '');
      this.NewsName = decodeURIComponent(params.get('nameNews') || '');
  
      if (this.NewsName) {
        this.getNewsDetail(this.NewsName);
        this.getRelatedNews(this.NewsName); // Gọi phương thức để lấy bài viết liên quan
      }

      this.apiDomains = [
        'https://api.ttdt03.id.vn',
        'https://api.congtt123.id.vn',
        'https://api.ttdt2503.id.vn'
      ];
    });

    const url = this.route.snapshot.url.map(segment => segment.path).join('/');

    if (url.startsWith('news-detail')) {
      this.backLink = '../../'; // Nếu ở Home → Chi tiết
    } else {
      this.backLink = '../'; // Nếu trong danh mục → Chi tiết
    }

    window.speechSynthesis.onvoiceschanged = () => {
      console.log("Danh sách giọng nói đã được tải:", window.speechSynthesis.getVoices());
    };
    
  }

  apiDomains: string[] = [];

  getSafeImagePath(imagePath: string): string {
    return imagePath?.replace(/\\/g, "/");
  }
  
  // Trả về link ảnh với fallback theo domainIndex
  getImageWithFallback(imagePath: string, domainIndex: number = 0): string {
    const safePath = this.getSafeImagePath(imagePath);
    const domain = this.apiDomains[domainIndex] || this.apiDomains[0];
    return `${domain}/api/images/${safePath}`;
  }
  
  getImageUrlWithFallback(obj: any, field: string): string {
    if (obj.domainIndex === undefined || obj.domainIndex === null) {
      obj.domainIndex = 0;
    }
    return this.getImageWithFallback(obj[field], obj.domainIndex);
  }
  
  handleImageError(event: Event, obj: any, field: string): void {
    if (obj.domainIndex === undefined) {
      obj.domainIndex = 0;
    }
  
    obj.domainIndex++;
  
    if (obj.domainIndex < this.apiDomains.length) {
      const target = event.target as HTMLImageElement;
      target.src = this.getImageWithFallback(obj[field], obj.domainIndex);
    } else {
      console.warn('❌ Không còn domain fallback khả dụng cho ảnh:', obj[field]);
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

  getNewsDetail(name: string): void {
    this.categoriesService.GetNews_EventByName(name).subscribe(
      data => {
        this.newsDetail = data;
        this.newsDetail.formatted_content = this.newsDetail.formatted_content
          .replace(/&nbsp;/g, ' ')  // Thay thế &nbsp; bằng dấu cách bình thường
          .replace(/\s+/g, ' ')     // Xóa khoảng trắng thừa
          .trim();                  // Loại bỏ khoảng trắng đầu & cuối
        console.log('Chi tiết bài viết:', this.newsDetail);
        if (this.newsDetail && this.newsDetail.isVisible == true) {
          const categoryId = this.newsDetail.id_categories; // Lấy id danh mục từ bài viết
          console.log(categoryId)
          // Gọi API để lấy tên danh mục dựa trên id_categories
          this.categoriesService.getCategoryNameById(categoryId).subscribe(
            categoryData => {
              console.log('Dữ liệu trả về từ API:', categoryData); // Kiểm tra dữ liệu trả về
          
              // Kiểm tra nếu categoryData có trường name_category
              if (categoryData && categoryData.name_category) {
                const categoryName = categoryData.name_category; // Lấy tên danh mục từ trường name_category
                console.log('Tên danh mục:', categoryName);

                this.titleService.setTitle(categoryName);
                
                // Chỉnh sửa tên danh mục nếu cần
                this.formatted = categoryName.replace(/-/g, ' ');
                
                // Load top 5 bài viết của danh mục
                this.loadTop5News(this.formatted);
              } else {
                console.error('Dữ liệu trả về không chứa trường name_category:', categoryData);
              }
            },
            error => {
              console.error('Lỗi khi lấy tên danh mục:', error);
            }
          );
          
        }
      },
      error => {
        console.log('Lỗi khi lấy dữ liệu bài viết:');
      }
    );
  }

  getRelatedNews(name: string): void {
    this.categoriesService.GetRelatedNews_Events(name).subscribe(
      data => {
        this.relatedNews = data;
        console.log('Bài viết liên quan:', this.relatedNews);
      },
      error => {
        console.error('Lỗi khi lấy bài viết liên quan:', error);
      }
    );
  }

  // Load top 5 news based on category ID
  loadTop5News(name: string): void {
    this.categoriesService.GetTop5NewsByCategory(name).subscribe(
      data => {
        console.log('Top 5 News:', data); // Kiểm tra dữ liệu trả về
        this.Top5LatestNewsByCate = data;
        this.cdRef.detectChanges();
      },
      error => {
        console.error('Error fetching top 5 news:', error);
      }
    );
  }

  // Phương thức để lấy bài viết liên quan hiện tại theo trang
  get paginatedRelateNews(): News_Events[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.relatedNews.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Phương thức để chuyển trang
  changePage(page: number): void {
    this.currentPage = page;
  }

  // Phương thức để lấy tổng số trang
  get totalPages(): number {
    return Math.ceil(this.relatedNews.length / this.itemsPerPage);
  }
  
  goBack(): void {
    this.location.back();
  }

  // Phóng to chữ
  increaseFontSize() {
    this.fontSize += 2;
    // document.body.style.fontSize = this.fontSize + 'px';
  }

  // Thu nhỏ chữ
  decreaseFontSize() {
    if (this.fontSize > 10) {
      this.fontSize -= 2;
      // document.body.style.fontSize = this.fontSize + 'px';
    }
  }
  
  // Đọc bài viết
  speechInstance: SpeechSynthesisUtterance | null = null;

  readArticle() {
    if (this.newsDetail && this.newsDetail.formatted_content) {
      // Nếu đang đọc, dừng trước khi bắt đầu mới
      this.stopReading();
  
      this.speechInstance = new SpeechSynthesisUtterance(this.newsDetail.formatted_content);
  
      // Lấy danh sách giọng nói sau một khoảng thời gian
      setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Danh sách giọng nói:", voices);
  
        // Tìm giọng nói tiếng Việt, ưu tiên giọng nữ
        const vietnameseVoice = voices.find(
          (voice) => voice.lang.includes('vi') && voice.name.toLowerCase().includes('female')
        ) || voices.find((voice) => voice.lang.includes('vi'));
  
        if (vietnameseVoice) {
          this.speechInstance!.voice = vietnameseVoice;
          console.log("Đã chọn giọng đọc:", vietnameseVoice.name);
        } else {
          console.warn("Không tìm thấy giọng đọc tiếng Việt!");
        }
  
        this.speechInstance!.lang = 'vi-VN';
        this.speechInstance!.rate = 1; // Tốc độ đọc
        this.speechInstance!.pitch = 1; // Cao độ
  
        // Khi đọc xong, đặt lại biến speechInstance
        this.speechInstance!.onend = () => {
          this.speechInstance = null;
        };
  
        window.speechSynthesis.speak(this.speechInstance!);
      }, 100);
    } else {
      console.error('Không có nội dung để đọc.');
    }
  }
    
  stopReading() {
    if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
      window.speechSynthesis.cancel(); // Dừng ngay lập tức
      this.speechInstance = null; // Xóa tham chiếu để đảm bảo không tiếp tục đọc
      console.log("Đã dừng đọc bài viết.");
    }
  }

}    
