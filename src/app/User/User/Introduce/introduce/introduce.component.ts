import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IntroduceService } from '../introduce.service';
import { Location } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
@Component({
  selector: 'app-introduce',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './introduce.component.html',
  styleUrl: './introduce.component.css'
})
export class IntroduceComponent implements OnInit {

  introduceDetail: any; // Thông tin chi tiết bài giới thiệu
  relatedIntroduce: any[] = []; // Bài giới thiệu liên quan
  fontSize: number = 16;
  categoryName: string | undefined;
  formattedCategoryIntroName: string | undefined;
  nameCategoryIntroduceOrigin: string='';
  
  constructor(
    private route: ActivatedRoute,
    private introduceService: IntroduceService,
    private cdRef: ChangeDetectorRef,
    private location: Location,
    private titleService: Title, private metaService: Meta
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const rawCategory = params.get('name') || '';
      console.log('Raw Category Name:', rawCategory);
    
      this.categoryName = decodeURIComponent(rawCategory);
      console.log('Decoded Category Name:', this.categoryName);
      
      // this.formattedCategoryIntroName = this.categoryName.replace(/-/g, ' ');
      // console.log('Formatted Category Introduce Name:', this.formattedCategoryIntroName);

      // this.GetIntroByNameCategogy(this.categoryName.replace(/-/g, ' '));
      this.GetIntroByNameCategogy(this.categoryName.replace(/-/g, ' '));

    });

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

  // Lấy thông tin chi tiết của bài giới thiệu theo tên danh mục
  GetIntroByNameCategogy(nameCate: string): void {
    this.introduceService.GetIntroByNameCategogy(nameCate).subscribe(
      data => {
        if (data && data.length > 0) {
          this.introduceDetail = data[0]; // Lấy bài viết đầu tiên trong danh sách

          console.log('Chi tiết giới thiệu:', this.introduceDetail);
          if (this.introduceDetail.id_introduce) {
            this.getRelatedIntroduce(this.introduceDetail.id_introduce);

            // Gọi hàm getCategories_introducesById để cập nhật title
            this.getCategories_introducesById(this.introduceDetail.id_cate_introduce);
          }
        } else {
          console.warn("Không có dữ liệu giới thiệu nào.");
        }
      },
      error => {
        console.error('Lỗi khi lấy dữ liệu giới thiệu:', error);
      }
    );
  }


  // Lấy tên danh mục set tite
  getCategories_introducesById(id: number): void {
    this.introduceService.GetCategories_introducesById(id).subscribe(
      data => {
        this.nameCategoryIntroduceOrigin = data.name_cate_introduce;
        // Đảm bảo cập nhật title sau khi lấy được tên danh mục
        this.titleService.setTitle(this.nameCategoryIntroduceOrigin);
      },
      error => {
        console.error('Lỗi khi lấy tên danh mục:', error);
      }
    );
  }
  
  // Lấy bài giới thiệu liên quan
  getRelatedIntroduce(id: number): void {
    this.introduceService.GetRelatedIntroduce(id).subscribe(
      data => {
        this.relatedIntroduce = data;
        console.log('Bài giới thiệu liên quan:', this.relatedIntroduce);
      },
      error => {
        console.error('Lỗi khi lấy bài giới thiệu liên quan:', error);
      }
    );
  }

  goBack(): void {
    this.location.back();
  }

  // Phóng to chữ
  increaseFontSize() {
    this.fontSize += 2;
  }

  // Thu nhỏ chữ
  decreaseFontSize() {
    if (this.fontSize > 10) {
      this.fontSize -= 2;
    }
  }

  // Đọc bài viết
  speechInstance: SpeechSynthesisUtterance | null = null;

  readArticle() {
    if (this.introduceDetail && this.introduceDetail.description) {
      this.stopReading();

      this.speechInstance = new SpeechSynthesisUtterance(this.introduceDetail.description);

      setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Danh sách giọng nói:", voices);

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
        this.speechInstance!.rate = 1;
        this.speechInstance!.pitch = 1;

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
      window.speechSynthesis.cancel();
      this.speechInstance = null;
      console.log("Đã dừng đọc bài viết.");
    }
  }

  //   formatCategoryName(name: string | null | undefined): string {
  //   const formattedName = name ? name.replace(/ /g, '-') : 'unknown-category';
  //   return formattedName;
  // }
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

  // Domain dùng chung
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