import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService } from '../home.service';
import { News_Events } from '../../../../Admin/admin/news_events/news_events.model';
import { RouterModule } from '@angular/router';
import { Documents } from '../../../../Admin/admin/documents/documents.model';
import { Categories } from '../../../../Admin/admin/categories/categories.component.model';
import { Category_documents } from '../../../../Admin/admin/categories-documents/categories-documents.model';
import { Observable } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './home.component.html',
  styleUrl: '../../../user-layout/user-layout.component.css'
})
export class HomeComponent_user {
  categories: Categories[] = [];
  top5NewsEvents: News_Events[] = [];
  Top5LatestNewsByCate: News_Events[] = [];
  tophot:News_Events[]=[];

  categoriesDoc: Category_documents[] = []; // Danh sách danh mục cha
  selectedCategory: string = ''; // Danh mục được chọn
  documents: Documents[] = []; // Danh sách văn bản
  displayedDocs: any[] = []; // Văn bản được hiển thị
  displayedNews: any[] = []; // Văn bản được hiển thị
  currentPageNews: number = 1;
  currentPageDocs: number = 1;
  itemsPerPage: number = 5;
  itemPageNews: number = 6;
  listNewsEvents: News_Events[] = [];

  constructor(
    private homeService: HomeService,
  ) {}

  apiDomains: string[] = [];

  ngOnInit(): void {
    this.getTop5NewsEvents();
    this.getTophotNewsEvents();
    this.loadCategoriesDoc();
    this.getNews();

    ///
    this.apiDomains = [
      'https://api.ttdt03.id.vn',
      'https://api.congtt123.id.vn',
      'https://api.ttdt2503.id.vn'
    ];
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
  
  getNews(): void {
    this.homeService.GetNews().subscribe(
      (data) => {
        this.listNewsEvents = data.filter(news => news.isVisible); // ✅ Lọc chỉ lấy bài viết hiển thị
        this.updateDisplayedNews();
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách bài viết:', error);
      }
    );
  }


  getTop5NewsEvents(): void {
    this.homeService.GetTop5News_Events().subscribe(
      (data) => {
        this.top5NewsEvents = data;
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách bài viết:', error);
      }
    );
  }
  getTophotNewsEvents(): void {
    this.homeService.GetHotNews().subscribe(
      (data) => {
        this.tophot = data; // Đúng biến cần gán
      },
      (error) => {
        console.error('Lỗi khi lấy danh sách bài viết nổi bật:', error);
      }
    );
  }

  loadCategoriesDoc(): void {
    // console.log('Loading category documents...');
    this.homeService.getCategoryDocHierarchy().subscribe(
      (data) => {
        console.log('Category hierarchy data:', data);
        this.categoriesDoc = data.filter((cat: any) => cat.documentParentId === null);
        console.log('Filtered parent categories:', this.categoriesDoc);
        if (this.categoriesDoc.length > 0) {
          this.selectCategoryDoc(this.categoriesDoc[0].name_category_document);
        }
      },
      (error) => {
        console.error('Error while loading category documents:', error);
      }
    );
  }

  selectCategoryDoc(categoryName: string): void {
    console.log(`Selecting category: ${categoryName}`);
    this.selectedCategory = categoryName;
    
      // Cập nhật danh mục được chọn
    this.selectedCategory = categoryName;

    // Reset currentPage về trang đầu tiên
    this.currentPageDocs = 1;

    // Reset documents trước khi gọi API
    // this.documents = [];
    let tempDocuments: Documents[] = []; // Mảng tạm để tránh mất dữ liệu
    
    this.homeService.getSubcategoriesByName(categoryName).subscribe(
      (subcategories) => {
        // Lấy dữ liệu cho danh mục chính
        this.homeService.getDocByCategory(categoryName).subscribe(
          (docs) => {
            // console.log(`Documents for main category ${categoryName}:`, docs);
            // this.documents = docs; // Gán tài liệu từ danh mục chính
            // this.documents = [...this.documents, ...docs]; // Giữ lại dữ liệu cũ và thêm dữ liệu mới
            tempDocuments = [...tempDocuments, ...docs]; // Lưu vào mảng tạm

            // this.updateDisplayedDocs();
            // console.log('Updated document list after adding main category:', this.documents);
            // Nếu không có danh mục con, cập nhật luôn
            if (!subcategories || subcategories.length === 0) {
              this.documents = tempDocuments;
              this.updateDisplayedDocs();
              return;
            }
    
            // Lấy tài liệu của danh mục con
            let requests: Observable<any>[] = subcategories.map((subName: string) =>
              this.homeService.getDocByCategory(subName)
            );

            Promise.all(requests.map((req: Observable<any>) => req.toPromise()))
              .then((results) => {
                results.forEach((docs, index) => {
                  console.log(
                    `Docs received for subcategory ${subcategories[index]}:`,
                    docs
                  ); // Debug

                  if (!Array.isArray(docs)) {
                    console.warn(
                      `Warning: Expected an array but received:`,
                      docs
                    );
                    docs = []; // Gán giá trị mặc định nếu API trả về null
                  }

                  tempDocuments = [...tempDocuments, ...docs];
                });

                this.documents = tempDocuments;
                this.updateDisplayedDocs();
              })
              .catch((error) => {
                console.error('Lỗi khi lấy tài liệu danh mục con:', error);
              });
          },
          (error) => {
            console.error(`Lỗi khi lấy tài liệu danh mục chính ${categoryName}:`, error);
          }
        );
      },
      (error) => {
      console.error(`Lỗi khi lấy danh mục con của ${categoryName}:`, error);
      }
    );
  }

  changePageNews(page: number): void {
    if (page < 1 || page > this.getTotalPagesNews()) return;
    this.currentPageNews = page;
    this.updateDisplayedNews();
  }
  
  getTotalPagesNews(): number {
    return Math.ceil(this.listNewsEvents.length / this.itemPageNews);
  }
  
  updateDisplayedNews(): void {
    const startIndex = (this.currentPageNews - 1) * this.itemPageNews;
    this.displayedNews = this.listNewsEvents.slice(startIndex, startIndex + this.itemPageNews);
  }

  changePageDocs(page: number): void {
    if (page < 1 || page > this.getTotalPagesDocs()) return;
    this.currentPageDocs = page;
    this.updateDisplayedDocs();
  }
  
  getTotalPagesDocs(): number {
    return Math.ceil(this.documents.length / this.itemsPerPage);
  }
  
  updateDisplayedDocs(): void {
    if (!this.documents || this.documents.length === 0) {
      console.warn("No documents available to display.");
      return;
    }
    const startIndex = (this.currentPageDocs - 1) * this.itemsPerPage;
    this.displayedDocs = this.documents.slice(startIndex, startIndex + this.itemsPerPage);
    console.log("Updated displayedDocs:", this.displayedDocs);
  }

  getSafeImagePath(imagePath: string): string {
    return imagePath?.replace(/\\/g, "/");
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

  handleImageError(event: Event, obj: any, field: string): void {
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

  showBackToTop: boolean = false;

  ngAfterViewInit(): void {
    window.addEventListener('scroll', () => {
      this.showBackToTop = window.scrollY > 100;
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}