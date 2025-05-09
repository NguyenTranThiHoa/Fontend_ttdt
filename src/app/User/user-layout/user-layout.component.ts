import { Component, OnInit } from '@angular/core';
import { UserLayoutService } from './user-layout.service';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WebsiteSettings } from '../../Admin/Admin_Layouts/website-settings.model';
@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, FormsModule],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.css'
})
export class UserLayoutComponent implements OnInit {

  categories: any[] = [];
  categoriesDoc: any[] = [];
  categoriesIntroduce: any[] = [];
  searchText: string = '';
  
  websiteSettings: WebsiteSettings | null = null; 

  constructor(
    private userlayoutService: UserLayoutService,
    private router:Router,
  ) {}

  apiDomains: string[] = [];
  bannerUrlToShow: string = '';
  bannerDomainIndex: number = 0;
  ngOnInit(): void {
    this.loadCategories();
    this.loadCategoriesDoc();
    this.loadCategoriesIntroduce();
    this.loadSettings();
    this.apiDomains = [
      'https://api.ttdt03.id.vn',
      'https://api.congtt123.id.vn',
      'https://api.ttdt2503.id.vn'
    ];
    // Sử dụng sessionStorage để theo dõi số lần tải lại
    let reloadCount = Number(sessionStorage.getItem('reloadCount')) || 0;

    if (reloadCount < 1) {
        reloadCount++;
        sessionStorage.setItem('reloadCount', reloadCount.toString());
        location.reload();
    } else {
        // Reset lại nếu đã tải đủ 5 lần
        sessionStorage.removeItem('reloadCount');
    }


  }

  getSafeImagePath(imagePath: string): string {
    return imagePath?.replace(/\\/g, "/");
  }
  // Trả về link ảnh với domain fallback
  getImageWithFallback(imagePath: string, domainIndex: number = 0): string {
    const safePath = this.getSafeImagePath(imagePath);
    const domain = this.apiDomains[domainIndex] || this.apiDomains[0];
    return `${domain}/api/images/${safePath}`;
  }

  // Tự động lấy ảnh theo field + domainIndex
  getImageUrlWithFallback(obj: any, field: string): string {
    if (!obj) return '';
    if (obj.domainIndex === undefined || obj.domainIndex === null) {
      obj.domainIndex = 0;
    }
    return this.getImageWithFallback(obj[field], obj.domainIndex);
  }

  // Tự fallback domain khi ảnh lỗi
  handleImageError(event: Event, obj: any, field: string): void {
    if (!obj) return;
    obj.domainIndex = (obj.domainIndex || 0) + 1;

    if (obj.domainIndex < this.apiDomains.length) {
      const target = event.target as HTMLImageElement;
      target.src = this.getImageWithFallback(obj[field], obj.domainIndex);
    } else {
      console.warn('❌ Không còn domain fallback khả dụng cho ảnh:', obj[field]);
    }
  }

  // Tải ảnh banner với fallback thủ công
  tryLoadBannerImage(imagePath: string): void {
    const safePath = this.getSafeImagePath(imagePath);

    if (this.bannerDomainIndex >= this.apiDomains.length) {
      console.warn('❌ Không thể tải ảnh banner từ bất kỳ domain nào.');
      this.bannerUrlToShow = '';
      return;
    }

    const domain = this.apiDomains[this.bannerDomainIndex];
    const testImg = new Image();

    testImg.onload = () => {
      this.bannerUrlToShow = `${domain}/api/images/${safePath}`;
    };

    testImg.onerror = () => {
      this.bannerDomainIndex++;
      this.tryLoadBannerImage(imagePath);
    };

    testImg.src = `${domain}/api/images/${safePath}`;
  }
  
  
  loadCategories() {
    this.userlayoutService.getCategoryHierarchy().subscribe((data: any[]) => {
      this.categories = data;
    });
  }
  
  toggleDropdown(category: any, event: Event) {
      event.preventDefault(); // Ngăn chặn hành vi mặc định
      event.stopPropagation(); // Ngăn chặn sự kiện lan ra ngoài
      category.isOpen = !category.isOpen;
  }

  toggleMenu() {
    const checkbox = document.getElementById('check') as HTMLInputElement;
    if (checkbox) {
        checkbox.checked = false; // Đặt checkbox về false
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

  // Hàm đệ quy để hiển thị cây danh mục
  displayCategory(category: any): string {
    return category.name_category;
  }

  // Hàm đệ quy để hiển thị các danh mục con
  displayChildren(children: any[]): any[] {
    return children;
  }
  ////////////////////////////////////////////////////////////////
  loadCategoriesDoc() {
    this.userlayoutService.getCategoryDocHierarchy().subscribe((data: any[]) => {
      this.categoriesDoc = data;
    });
  }
  // Hàm đệ quy để hiển thị cây danh mục
  displayCategoryDoc(category: any): string {
    return category.name_category_document;
  }

  ////////////////////////////////////////////////////////////////
  loadCategoriesIntroduce() {
    this.userlayoutService.getCategoryIntroduce().subscribe((data: any[]) => {
      this.categoriesIntroduce = data;
      console.log("danh mục gth:",data);
    });
  }   

  onSearch(): void {
    if (this.searchText.trim()) {
      // Navigate to the search route with the search text as a URL parameter
      this.router.navigate([`/search`,this.searchText]);
    }
    this.searchText='';
  }

  //setting
  loadSettings(): void {
    this.userlayoutService.getWebsiteSettings().subscribe({
      next: (settings: WebsiteSettings[]) => {
        console.log("Dữ liệu từ API:", settings);
        
        if (settings.length > 0) {
          this.websiteSettings = settings[0]; // Lấy phần tử đầu tiên của mảng

          (this.websiteSettings as any).bannerDomainIndex = 0;

          if (this.websiteSettings.bannerUrl) {
            const safePath = this.getSafeImagePath(this.websiteSettings.bannerUrl);
            this.tryLoadBannerImage(safePath);
          }
        }
      },
      error: (err) => console.error("Lỗi khi tải danh sách:", err),
    });
  }
}
