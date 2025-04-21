import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Documents } from '../../../../Admin/admin/documents/documents.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CategogyDocService } from '../categogy-doc.service';
import { Meta, Title } from '@angular/platform-browser';

import { SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-category-doc-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-doc-detail.component.html',
  styleUrl: './category-doc-detail.component.css'
})
export class CategoryDocDetailComponent implements OnInit {

  docDetail!: Documents;
  fileUrl: SafeUrl | undefined;
  relatedDoc: Documents[] = []; // Biến để lưu trữ bài viết liên quan
  currentPage: number = 1;
  itemsPerPage: number = 8; // Số bài viết trên mỗi trang
  Top5LatestDocByCate: Documents[] = []; // Top 5 news
  fontSize: number = 16;
  nameDocs: string ='';
  formattedDocName: any;
  nameCategoryDocsOrigin: string ='';

  backLink: string = '../';

  constructor(
    private route: ActivatedRoute,
    private categoryDocsService: CategogyDocService,
    private cdRef: ChangeDetectorRef,
    private location: Location,
    private sanitizer: DomSanitizer,
    private titleService: Title, private metaService: Meta,
    private http: HttpClient

  ) {}

  pdfLoaded: boolean = false;
  detailLoading: boolean = false;
  safeDetailPdfUrl: SafeResourceUrl | null = null;
  currentDomainIndex: number = 0;

  domains: string[] = [
    'https://api.ttdt2503.id.vn',
    'https://api.ttdt03.id.vn',
    'https://api.congtt123.id.vn'
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.nameDocs = decodeURIComponent(params.get('nameDocs') || '');
  
      if (this.nameDocs) {
        this.getDocDetail(this.nameDocs);
      }
    });
    const url = this.route.snapshot.url.map(segment => segment.path).join('/');

    if (url.startsWith('document-detail')) {
      this.backLink = '../../'; // Nếu ở Home → Chi tiết
    } else {
      this.backLink = '../'; // Nếu trong danh mục → Chi tiết
    }
  }

  getDocDetail(name: string): void {
    this.categoryDocsService.GetDocByName(name).subscribe(
      data => {
        this.docDetail = data;
        console.log('Chi tiết bài viết:', this.docDetail);
        
        if (this.docDetail) {
          const id = this.docDetail.id_document; // Lấy id của bài viết
          const id_category_document = this.docDetail.id_category_document; // Lấy id_category_document

          console.log("id_cate_doc", id_category_document)
          if (id_category_document !== null) {
            this.getCategories_DocsById (id_category_document);
          }
          
          this.getRelatedDoc(id); // Gọi phương thức để lấy bài viết liên quan
          
          if(id_category_document){
            this.loadTop5Doc(id_category_document);
          }

          // Kiểm tra nếu file_path không null
          if (this.docDetail.file_path) {
              // this.getDocumentFile(id);
              this.tryLoadDetailPdf(); 
          } else {
              console.warn('Không có file_path hoặc docDetail là null.');
          }
        }
      },
      error => {
        console.error('Lỗi khi lấy dữ liệu bài viết:', error);
      }
    );
  }

  // Lấy tên danh mục set tite
  getCategories_DocsById(id: number): void {
    this.categoryDocsService.getCategoryNameById(id).subscribe(
      data => {
        this.nameCategoryDocsOrigin = data.name_category_document;
        //set title
        this.titleService.setTitle(this.nameCategoryDocsOrigin);
      },
      error => {
        console.error('Lỗi khi lấy tên danh mục:', error);
      }
    );
  }

  getRelatedDoc(id: number): void {
    this.categoryDocsService.GetRelatedDoc(id).subscribe(
      data => {
        this.relatedDoc = data;
        console.log('Văn bản liên quan:', this.relatedDoc);
      },
      error => {
        console.error('Lỗi khi lấy văn bản liên quan:', error);
      }
    );
  }

  // Phương thức để lấy bài viết liên quan hiện tại theo trang
  get paginatedRelateDoc(): Documents[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.relatedDoc.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Phương thức để chuyển trang
  changePage(page: number): void {
    this.currentPage = page;
  }

  // Phương thức để lấy tổng số trang
  get totalPages(): number {
    return Math.ceil(this.relatedDoc.length / this.itemsPerPage);
  }

  // Load top 5 news based on category ID
  loadTop5Doc(id: number): void {
    this.categoryDocsService.GetTop5DocByCategory(id).subscribe(
      data => {
        console.log('Top 5 Document:', data); // Kiểm tra dữ liệu trả về
        this.Top5LatestDocByCate = data;
        this.cdRef.detectChanges();
      },
      error => {
        console.error('Error fetching top 5 document:', error);
      }
    );
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

  getDocumentFile(id: number): void {
    this.categoryDocsService.getDocumentFile(id).subscribe(
      (blob: Blob) => {
        // Tạo URL từ blob và lưu vào biến fileUrl
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = this.docDetail.file_path;
        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      },
      (error) => {
        console.error('Lỗi khi tải tài liệu:', error);
      }
    );
  }
  // Tải tài liệu khi người dùng click vào
  downloadFile(id: number): void {
    this.categoryDocsService.getDocumentFile(id).subscribe(
      (blob: Blob) => {
        // Tạo URL từ blob và tải file về
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = this.docDetail.file_path; // Bạn có thể lấy tên file từ response hoặc docDetail
        link.click();
      },
      error => {
        console.error('Lỗi khi tải tài liệu:', error);
      }
    );
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

  safeFileUrl!: SafeResourceUrl; 

  getSafeUrl(filePath: string) {
    const primaryUrl = 'https://api.ttdt2503.id.vn/api/pdf/' + filePath;
    const fallbackUrl = 'https://api.ttdt03.id.vn/api/pdf/' + filePath;

    this.http.head(primaryUrl, { observe: 'response' }).subscribe({
      next: res => {
        this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(primaryUrl);
      },
      error: err => {
        this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fallbackUrl);
      }
    });
  }

    // Hàm kiểm tra và bắt đầu load PDF
  tryLoadDetailPdf(): void {
    const filePath = this.docDetail?.file_path?.replace(/\\/g, "/");
    if (!filePath) {
      this.safeDetailPdfUrl = null;
      this.detailLoading = false;
      return;
    }

    this.detailLoading = true;
    const domain = this.domains[this.currentDomainIndex];
    const url = `${domain}/api/pdf/${filePath}`;
    console.log(`🔍 Thử load PDF từ: ${url}`);

    this.http.head(url, { observe: 'response' }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.safeDetailPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          // Chờ iframe load thành công mới set pdfLoaded = true
          console.log(`✅ Tải được PDF từ: ${domain}`);
        } else {
          this.loadNextDomainForDetailPdf();
        }
      },
      error: () => {
        this.loadNextDomainForDetailPdf();
      }
    });
  }

  loadNextDomainForDetailPdf(): void {
    this.currentDomainIndex++;
    if (this.currentDomainIndex < this.domains.length) {
      this.tryLoadDetailPdf();
    } else {
      this.safeDetailPdfUrl = null;
      this.detailLoading = false;
      console.warn("❌ Không thể tải PDF từ bất kỳ domain nào.");
    }
  }

  // Khi iframe load xong
  handleDetailPdfLoad(): void {
    this.pdfLoaded = true;
    this.detailLoading = false;
  }

}
