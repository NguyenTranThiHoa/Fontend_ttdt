import { Component, OnInit } from '@angular/core';
import { forkJoin, lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Introduce } from '../../../../Admin/admin/categories-introduce/introduce.model';
import { News_Events } from '../../../../Admin/admin/news_events/news_events.model';
import { Documents } from '../../../../Admin/admin/documents/documents.model';
import { SearchService } from '../search.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Procedure } from '../../../../Admin/admin/procedure/procedure.model';
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  introduces: Introduce[] = [];
  newsEvents: News_Events[] = [];
  documents: Documents[] = [];
  procedures: Procedure[] = [];

  // Danh sách lọc
  filteredIntroduces: Introduce[] = [];
  filteredNews: News_Events[] = [];
  filteredDocuments: Documents[] = [];
  filteredProcedures: Procedure[] = [];

  searchText: string = '';

  constructor(
    private http: HttpClient, 
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Gọi tất cả dữ liệu, sau đó tìm kiếm
      await Promise.all([
        this.loadIntroduce(),
        this.loadNews(),
        this.loadDocs(),
        this.loadProcedures()
      ]);
  
      // Sau khi tải tất cả dữ liệu xong, thực hiện tìm kiếm nếu có query
      this.route.paramMap.subscribe(params => {
        const query = params.get('query');
        if (query) {
          this.searchText = decodeURIComponent(query).trim();
          this.searchData(); // Gọi tìm kiếm sau khi có dữ liệu
        }
      });
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu trong ngOnInit', error);
    }

    this.apiDomains = [
      'https://api.ttdt03.id.vn',
      'https://api.congtt123.id.vn',
      'https://api.ttdt2503.id.vn'
    ];
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

  search(): void {
    const query = this.searchText.trim();
    if (query) {
      this.router.navigate(['/search', query]); // Điều hướng khi có từ khóa
    } else {
      this.searchText = ''; // Xóa chuỗi tìm kiếm
      this.router.navigate(['/search', this.searchText]);
      this.searchData(); // Hiển thị lại toàn bộ dữ liệu
    }
  }

  async loadIntroduce(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.searchService.GetIntroduce().subscribe(
        async (data) => {
          console.log(data)
          if (data ) { // Kiểm tra dữ liệu có tồn tại hay không
            for (let item of data) {
              try {
                const categoryNameResponse = await lastValueFrom(this.searchService.getCategoryNameIntroById(item.id_cate_introduce));
              
                // Kiểm tra xem categoryNameResponse có phải là đối tượng không và lấy tên từ đối tượng đó
                if (categoryNameResponse && categoryNameResponse.name_cate_introduce) {
                  item.categoryName = categoryNameResponse.name_cate_introduce; // Lấy giá trị name từ đối tượng
                } else {
                  item.categoryName = "Không xác định"; // Nếu không có name thì gán giá trị mặc định
                }
              } catch (error) {
                console.error(`Lỗi khi lấy danh mục ID ${item.id_cate_introduce}:`, error);
                item.categoryName = "Không xác định"; // Gán giá trị mặc định nếu có lỗi
              }
            }
            this.introduces = data;  // Gán data sau khi kiểm tra
            this.filteredIntroduces = data;
            resolve();
          } else {
            console.error('Lỗi khi tải Introduce! Dữ liệu trả về là undefined.');
            reject('Dữ liệu không hợp lệ');
          }
        },
        (error) => {
          console.error('Lỗi khi tải Introduce!', error);
          reject(error);
        }
      );
    });
  }
  
  async loadNews(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.searchService.GetNews_Events().subscribe(
        async (data) => {
          if (data && Array.isArray(data)) {  // Kiểm tra dữ liệu có tồn tại & là mảng không
            const visibleNews = data.filter(item => item.isVisible === true); // ✅ Chỉ lấy bài viết có isVisible = true

            for (let item of visibleNews) {
              try {
                const categoryNameResponse = await lastValueFrom(
                  this.searchService.getCategoryNameById(item.id_categories)
                );

                // Kiểm tra xem categoryNameResponse có dữ liệu hợp lệ không
                item.categoryName = categoryNameResponse?.name_category ?? "Không xác định";
              } catch (error) {
                console.error(`❌ Lỗi khi lấy danh mục ID ${item.id_categories}:`, error);
                item.categoryName = "Không xác định";
              }
            }

            this.newsEvents = visibleNews;  // ✅ Chỉ gán bài viết có isVisible = true
            this.filteredNews = visibleNews;
            resolve();
          } else {
            console.error("❌ Lỗi khi tải News_Events! Dữ liệu trả về không hợp lệ.");
            reject("Dữ liệu không hợp lệ");
          }
        },
        (error) => {
          console.error("❌ Lỗi khi tải News_Events!", error);
          reject(error);
        }
      );
    });
  }

  
  async loadDocs(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.searchService.GetDocuments().subscribe(
        async (data) => {
          if (data && Array.isArray(data)) {  // Kiểm tra dữ liệu có tồn tại & là mảng không
            const visibleDocs = data.filter(item => item.isVisible === true); // ✅ Lọc tài liệu có isVisible = true

            for (let item of visibleDocs) {
              if (item.id_category_document !== null) {
                try {
                  const categoryNameResponse = await lastValueFrom(
                    this.searchService.getCategoryNameDocById(item.id_category_document)
                  );

                  // Kiểm tra dữ liệu danh mục & gán tên danh mục
                  item.categoryName = categoryNameResponse?.name_category_document ?? "Không xác định";
                } catch (error) {
                  console.error(`❌ Lỗi khi lấy danh mục ID ${item.id_category_document}:`, error);
                  item.categoryName = "Không xác định";
                }
              } else {
                item.categoryName = "Không xác định"; // ✅ Nếu không có danh mục
              }
            }

            this.documents = visibleDocs;  // ✅ Chỉ gán tài liệu có isVisible = true
            this.filteredDocuments = visibleDocs;
            resolve();
          } else {
            console.error("❌ Lỗi khi tải Documents! Dữ liệu không hợp lệ.");
            reject("Dữ liệu không hợp lệ");
          }
        },
        (error) => {
          console.error("❌ Lỗi khi tải Documents!", error);
          reject(error);
        }
      );
    });
  }

    
  async loadProcedures(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.searchService.GetProcedures().subscribe(
        async (data) => {
          if (data && Array.isArray(data)) { // ✅ Kiểm tra dữ liệu có tồn tại & là mảng không
            const visibleProcedures = data.filter(item => item.isVisible === true); // ✅ Lọc dữ liệu hiển thị

            for (let item of visibleProcedures) {
              try {
                const categoryNameResponse = await lastValueFrom(
                  this.searchService.getCategoryNameFieldById(item.id_Field)
                );

                // ✅ Kiểm tra & gán tên danh mục
                item.categoryName = categoryNameResponse?.name_Field ?? "Không xác định";
              } catch (error) {
                console.error(`❌ Lỗi khi lấy danh mục ID ${item.id_Field}:`, error);
                item.categoryName = "Không xác định";
              }
            }

            this.procedures = visibleProcedures;  // ✅ Chỉ gán danh sách có isVisible = true
            this.filteredProcedures = visibleProcedures;
            resolve();
          } else {
            console.error("❌ Lỗi khi tải Procedures! Dữ liệu không hợp lệ.");
            reject("Dữ liệu không hợp lệ");
          }
        },
        (error) => {
          console.error("❌ Lỗi khi tải Procedures!", error);
          reject(error);
        }
      );
    });
  }

  
  // Chuẩn hóa chuỗi để tìm kiếm chính xác hơn
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD") // Chuyển thành Unicode tổ hợp
      .replace(/[\u0300-\u036f]/g, ""); // Loại bỏ dấu tiếng Việt
  }
  
  searchData(): void {
      const search = this.normalizeText(this.searchText.trim());
    
      if (search === '') {
        this.filteredIntroduces = this.introduces;
        this.filteredNews = this.newsEvents;
        this.filteredDocuments = this.documents;
        this.filteredProcedures = this.procedures;
      } else {
        this.filteredIntroduces = this.introduces.filter((intro) =>
          this.normalizeText(intro.name_introduce).includes(search)
        );
        this.filteredNews = this.newsEvents.filter((news) =>
          this.normalizeText(news.title).includes(search)
        );
        this.filteredDocuments = this.documents.filter((doc) =>
          this.normalizeText(doc.title).includes(search)
        );
        this.filteredProcedures = this.procedures.filter((proc) =>
          this.normalizeText(proc.name_procedures).includes(search)
        );
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
