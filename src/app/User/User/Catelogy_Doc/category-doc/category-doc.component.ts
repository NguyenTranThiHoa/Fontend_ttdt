import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Documents } from '../../../../Admin/admin/documents/documents.model';
import { forkJoin, map, Observable } from 'rxjs';
import { CategogyDocService } from '../categogy-doc.service';
import { Meta, Title } from '@angular/platform-browser';


@Component({
  selector: 'app-category-doc',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-doc.component.html',
  styleUrl: './category-doc.component.css'
})
export class CategoryDocComponent implements OnInit{

  categoryName: string = '';
  subCategoryName: string = '';
  formattedCategoryDocName: string = '';
  formattedSubCategoryName: string = '';
  documents: Documents[] = []; // Lưu danh sách văn bản
  Top5LatestDocByCate: Documents[] = []; // Top 5 doc
  currentPage: number = 1;
  itemsPerPage: number = 5; // Số bài viết trên mỗi trang
  // categorySubDoc: { name: string, doc: Documents[] }[] = []; // Lưu danh sách văn bản theo danh mục con

  currentPageSub: number = 1;
  itemsPerPageSub: number = 5; // Số tài liệu trên mỗi trang
  categorySubDoc: { name: string, doc: Documents[] }[] = []; // Danh mục con chứa tài liệu
  nameCategoryDocsOrigin: string ='';
  constructor(
    private route: ActivatedRoute,
    private categoryDocsService: CategogyDocService,
    private cdRef: ChangeDetectorRef,
    private titleService: Title, private metaService: Meta

  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

    this.categoryName = decodeURIComponent(params.get('name') || '');
    this.subCategoryName = decodeURIComponent(params.get('subcategory') || '');

    // Format lại tên danh mục cha và danh mục con
    this.formattedCategoryDocName = this.categoryName.replace(/-/g, ' ');
    this.formattedSubCategoryName = this.subCategoryName.replace(/-/g, ' ');

    console.log('Formatted Category Name:', this.formattedCategoryDocName); // Debug xem có đúng không
    console.log('Formatted SubCategory Name:', this.formattedSubCategoryName);

    this.loadDoc(this.categoryName, this.formattedSubCategoryName);
      // const id = params.get('id') ? Number(params.get('id')) : null;
      // if(id){
      //   this.loadTop5Doc(id);
      // }
    });    
  }
  
  loadDoc(formattedCategoryDocName: string, formattedSubCategoryName: string = ''): void {
    let categoryPath = formattedSubCategoryName ? `${formattedCategoryDocName}/${formattedSubCategoryName}` : formattedCategoryDocName;

    // Kiểm tra nếu categoryPath là null hoặc rỗng
    if (!categoryPath) {
        this.documents = []; // Nếu không có danh mục, xóa dữ liệu cũ
        this.cdRef.detectChanges(); // Cập nhật UI ngay lập tức
        return; 
    }

    // Xóa dữ liệu cũ ngay lập tức trước khi gọi API
    this.documents = [];
    this.categorySubDoc = [];
    this.cdRef.detectChanges();

    // Gọi API để lấy tài liệu theo danh mục
    this.categoryDocsService.getDocByCategory(categoryPath).subscribe(
      data => {
        this.documents = data;
        const categoryId = this.documents[0].id_category_document
        if (categoryId !== null) {
          this.getCategories_DocById(categoryId); // Gọi hàm nếu categoryId hợp lệ
        }
        console.log('Danh sách văn bản:', this.documents);
        this.cdRef.detectChanges();

        // Kiểm tra nếu documents không rỗng
        if (this.documents && this.documents.length > 0) {
          const id = this.documents[0].id_category_document; // Lấy id danh mục từ bài viết

          // Kiểm tra nếu id không null
          if (id !== null) {
              this.loadTop5Doc(id);
          } else {
              console.warn('id_category_document là null cho tài liệu đầu tiên.');
          }
        } else {
            console.warn('Không có tài liệu nào được tìm thấy.');
        }
      },
      // error => {
      //     console.error('Lỗi khi lấy dữ liệu:', error);
      // }
    );

    // Gọi API để lấy danh sách danh mục con
    this.categoryDocsService.getSubcategoriesByName(categoryPath).subscribe(
      subCat => {
        console.log('Danh sách danh mục con:', subCat);

        // Kiểm tra nếu subCat không rỗng
        if (subCat && subCat.length > 0) {
          // Gọi API để lấy bài viết cho từng danh mục con
          const subCategoryRequests: Observable<{ name: string; doc: Documents[] }> [] = subCat.map((subCategoryName: string) => {
            console.log('Danh mục con:', subCategoryName);

            return this.categoryDocsService.getDocByCategory(subCategoryName).pipe(
              map(articles => {
                console.log(`Bài viết trong danh mục con ${subCategoryName}:`, articles);
                return {
                    name: subCategoryName, // Tên danh mục con
                    doc: articles // Gán bài viết vào thuộc tính doc của danh mục con
                };
              })
            );
          });

          // Sử dụng forkJoin để đợi tất cả các yêu cầu hoàn thành
          forkJoin(subCategoryRequests).subscribe(
            (results: { name: string; doc: Documents[] }[]) => {
                this.categorySubDoc = results; // Gán kết quả vào categorySubDoc
                this.cdRef.detectChanges(); // Cập nhật UI sau khi nhận được tất cả dữ liệu
            },
            error => {
                console.error('Lỗi khi lấy tài liệu cho danh mục con:', error);
            }
          );
        } else {
            console.warn('Không có danh mục con nào được tìm thấy.');
        }
      },
      error => {
          console.error('Lỗi khi lấy danh mục con:', error);
      }
    );
  }

  // Load top 5 news based on category ID
  loadTop5Doc(id: number): void {
    this.categoryDocsService.GetTop5DocByCategory(id).subscribe(
      data => {
        console.log('Top 5 News:', data); // Kiểm tra dữ liệu trả về
        this.Top5LatestDocByCate = data;
        this.cdRef.detectChanges();
      },
      error => {
        console.error('Error fetching top 5 news:', error);
      }
    );
  }
  
  // Lấy tên danh mục set tite
  getCategories_DocById(id: number): void {
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
  
  // Phương thức để lấy bài viết hiện tại theo trang
  get paginatedDoc(): Documents[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.documents.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Phương thức để chuyển trang
  changePage(page: number): void {
    this.currentPage = page;
  }

  // Phương thức để lấy tổng số trang
  get totalPages(): number {
    return Math.ceil(this.documents.length / this.itemsPerPage);
  }

  // Lấy tài liệu đã phân trang
  get paginatedSubDoc(): { name: string; doc: Documents[] }[] {
    const startIndex = (this.currentPageSub - 1) * this.itemsPerPageSub;
    const endIndex = startIndex + this.itemsPerPageSub;

    // Lấy danh sách tài liệu đã phân trang
    const paginatedArticles = this.categorySubDoc
        .flatMap(sub => sub.doc)
        .slice(startIndex, endIndex);

    // console.log('Tổng số tài liệu để hiển thị:', paginatedArticles.length);

    // Gom nhóm lại theo danh mục con
    const result: { name: string; doc: Documents[] }[] = [];

      for (const sub of this.categorySubDoc) {
          const filteredDocs = paginatedArticles.filter(doc => sub.doc.includes(doc));
          if (filteredDocs.length > 0) {
              result.push({ name: sub.name, doc: filteredDocs });
          }
      }

    return result;
  }

  // Phương thức để chuyển trang
  changePageSub(page: number): void {
    this.currentPageSub = page;
  }

  // Tính tổng số trang
  get totalPageSub(): number {
    const totalDocs = this.categorySubDoc.reduce((sum, subCategory) => sum + subCategory.doc.length, 0);
    // console.log('Tổng số tài liệu:', totalDocs);
    return Math.ceil(totalDocs / this.itemsPerPageSub);
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
  
  
  
  
  
}

