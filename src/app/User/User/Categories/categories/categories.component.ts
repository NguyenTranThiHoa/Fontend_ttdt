import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CategoriesService } from '../categories.service';
import { News_Events } from '../../../../Admin/admin/news_events/news_events.model';
import { CommonModule } from '@angular/common';
import { forkJoin, map, Observable } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink] ,
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})

export class CategoriesComponent_user implements OnInit {

  categoryName: string = '';
  subCategoryName: string = '';
  formattedCategoryNew_EventName: string = '';
  formattedSubCategoryName: string = '';
  newsEvents: News_Events[] = []; // Lưu danh sách bài viết
  Top5LatestNewsByCate: News_Events[] = []; // Top 5 news
  currentPage: number = 1;
  itemsPerPage: number = 5; // Số bài viết trên mỗi trang
  currentPageSub: number = 1;
  itemsPerPageSub: number = 5; // Số bài viết trên mỗi trang
  categorySubNews: { name: string, news: News_Events[] }[] = []; // Lưu danh sách bài viết theo danh mục con
  nameCategoryNewsOrigin: string = '';

  constructor(
    private route: ActivatedRoute,
    private categoriesService: CategoriesService,
    private cdRef: ChangeDetectorRef,
    private titleService: Title, private metaService: Meta

  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

    this.apiDomains = [
      'https://api.ttdt03.id.vn',
      'https://api.congtt123.id.vn',
      'https://api.ttdt2503.id.vn'
    ];

    this.categoryName = decodeURIComponent(params.get('name') || '');
    this.subCategoryName = decodeURIComponent(params.get('subcategory') || '');

    // Format lại tên danh mục cha và danh mục con
    this.formattedCategoryNew_EventName = this.categoryName.replace(/-/g, ' ');
    this.formattedSubCategoryName = this.subCategoryName.replace(/-/g, ' ');

    console.log('Formatted Category Name:', this.formattedCategoryNew_EventName); // Debug xem có đúng không
    console.log('Formatted SubCategory Name:', this.formattedSubCategoryName);

    this.loadNews(this.categoryName, this.formattedSubCategoryName);
    if(this.categoryName){
      this.loadTop5News(this.categoryName);
    }
    });    
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

  loadNews(formattedCategoryNew_EventName: string, formattedSubCategoryName: string = ''): void {
    let categoryPath = formattedSubCategoryName ? `${formattedCategoryNew_EventName}/${formattedSubCategoryName}` : formattedCategoryNew_EventName;
    
    if (!categoryPath) {
      this.newsEvents = []; // Nếu không có danh mục, xóa dữ liệu cũ
      this.cdRef.detectChanges(); // Cập nhật UI ngay lập tức
      return; 
    }

      // Xoá dữ liệu cũ ngay lập tức trước khi gọi API
    this.newsEvents = [];
    this.categorySubNews = [];
    this.cdRef.detectChanges();

    this.categoriesService.getNewsByCategory(categoryPath).subscribe(
      data => {
        this.newsEvents = data;
        
        const categoryId = this.newsEvents[0].id_categories; 
        this.getCategories_newsById(categoryId); // Gọi hàm đúng cách
        
        
        console.log('Danh sách bài viết:', this.newsEvents);
        this.cdRef.detectChanges();
        // if (this.newsEvents.length > 0) {
        //   const name = this.newsEvents[0].id_categories// Lấy id danh mục từ bài viết
        //   this.loadTop5News(name);
        // }
      },
      error => {
        console.error('Lỗi khi lấy dữ liệu:', error);
      }
    );

    this.categoriesService.getSubcategoriesByName(categoryPath).subscribe(subCat => {
      console.log('Danh sách danh mục con:', subCat);
      // Gọi API để lấy bài viết cho từng danh mục con
      const subCategoryRequests: Observable<{ name: string; news: News_Events[] }> [] = subCat.map((subCategoryName: string) => {
        console.log('Danh mục con:', subCategoryName);
  
        return this.categoriesService.getNewsByCategory(subCategoryName).pipe(
          map(articles => {
            console.log(`Bài viết trong danh mục con ${subCategoryName}:`, articles);
            return {
              name: subCategoryName, // Tên danh mục con
              news: articles// Gán bài viết vào thuộc tính news của danh mục con
            };
          })
        );
      });
  
      // Sử dụng forkJoin để đợi tất cả các yêu cầu hoàn thành
      forkJoin(subCategoryRequests).subscribe((results: { name: string; news: News_Events[] }[]) => {
        this.categorySubNews = results; // Gán kết quả vào categorySubNews
        this.cdRef.detectChanges(); // Cập nhật UI sau khi nhận được tất cả dữ liệu
      });
    });  
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

  // Lấy tên danh mục set tite
  getCategories_newsById(id: number): void {
    this.categoriesService.getCategoryNameById(id).subscribe(
      data => {
        this.nameCategoryNewsOrigin = data.name_category;
        //set title
        this.titleService.setTitle(this.nameCategoryNewsOrigin);
      },
      error => {
        console.error('Lỗi khi lấy tên danh mục:', error);
      }
    );
  }
  
  // Phương thức để lấy bài viết hiện tại theo trang
  get paginatedNews(): News_Events[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.newsEvents.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Phương thức để chuyển trang
  changePage(page: number): void {
    this.currentPage = page;
  }

  // Phương thức để lấy tổng số trang
  get totalPages(): number {
    return Math.ceil(this.newsEvents.length / this.itemsPerPage);
  }



  // Phương thức để lấy bài viết hiện tại theo trang
  // get paginatedSubNews(): { name: string; news: News_Events[] }[] {
  //   const startIndex = (this.currentPageSub - 1) * this.itemsPerPageSub;
  //   return this.categorySubNews.slice(startIndex, startIndex + this.itemsPerPageSub);
  // }
  get paginatedSubNews(): { name: string; news: News_Events[] }[] {
    const startIndex = (this.currentPageSub - 1) * this.itemsPerPageSub;
    const endIndex = startIndex + this.itemsPerPageSub;
  
    // Lấy danh sách bài viết đã phân trang
    const paginatedArticles = this.categorySubNews
      .flatMap(sub => sub.news)
      .slice(startIndex, endIndex);
  
    // console.log('Tổng số bài viết để hiển thị:', paginatedArticles.length);
  
    // Gom nhóm lại theo danh mục con
    const result: { name: string; news: News_Events[] }[] = [];
  
    for (const sub of this.categorySubNews) {
      const filteredNews = paginatedArticles.filter(article => sub.news.includes(article));
      if (filteredNews.length > 0) {
        result.push({ name: sub.name, news: filteredNews });
      }
    }
  
    return result;
  }
  
  

  // Phương thức để chuyển trang
  changePageSub(page: number): void {
    this.currentPageSub = page;
  }

  // Phương thức để lấy tổng số trang
  // get totalPageSub(): number {
  //   return Math.ceil(this.categorySubNews.length / this.itemsPerPageSub);
  // }
  
  get totalPageSub(): number {
    const totalArticles = this.categorySubNews.reduce((sum, subCategory) => sum + subCategory.news.length, 0);
    // console.log('Tổng số bài viết:', totalArticles);
    return Math.ceil(totalArticles / this.itemsPerPageSub);
  }
  
}
