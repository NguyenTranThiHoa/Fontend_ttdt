import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProceduresService } from '../procedures.service';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';


@Component({
  selector: 'app-procedures',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './procedures.component.html',
  styleUrl: './procedures.component.css'
})
export class ProceduresComponent implements OnInit {

  allProcedures: any[] = [];      // ✅ Tất cả thủ tục (dùng để lọc lại)
  procedures: any[] = [];         // ✅ Thủ tục theo lĩnh vực được chọn
  filteredProcedures: any[] = []; // ✅ Sau khi lọc theo text
  pagedProcedures: any[] = [];

  categories: any[] = [];
  selectedCategoryId: number | null = null;
  searchText: string = "";

  noProceduresMessage: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 0;
  pages: number[] = [];

  constructor(
    private proceduresService: ProceduresService,
    private titleService: Title, private metaService: Meta
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Thủ tục hành chính');
    this.loadCategories(() => {
    this.loadProcedures();
    });
  }

  // Lấy tất cả thủ tục
  loadProcedures() {
    this.proceduresService.GetProcedures().subscribe(data => {
      this.allProcedures = data
        .filter(proc => proc.isVisible)
        .map(proc => ({
          ...proc,
          category_name: this.getCategoryName(proc.id_Field)
        }));

      this.updateProceduresByCategory(); // Lọc theo lĩnh vực nếu có
    });
  }

  // Khi chọn ngành/lĩnh vực
  onCategorySelect() {
    this.currentPage = 1;
    this.updateProceduresByCategory();
  }

  // Cập nhật danh sách procedures theo category đã chọn
  updateProceduresByCategory() {
    const selectedId = this.selectedCategoryId !== null ? Number(this.selectedCategoryId) : null;
  
    if (selectedId !== null) {
      this.procedures = this.allProcedures.filter(p => p.id_Field === selectedId);
    } else {
      this.procedures = [...this.allProcedures]; // Tất cả
    }
  
    this.filterProcedures(); // Lọc theo text nếu có
  }
  

  // Lọc theo từ khóa
  filterProcedures() {
    const search = this.searchText.trim().toLowerCase();

    this.filteredProcedures = this.procedures.filter(p =>
      !search || p.name_procedures.toLowerCase().includes(search)
    );

    this.noProceduresMessage = this.filteredProcedures.length === 0 ? 'Không có thủ tục nào phù hợp.' : '';
    this.currentPage = 1;
    this.updatePagination();
  }

  getAllChildCategoryIds(categoryId: number): number[] {
    const result: number[] = [];
  
    function collectIds(categories: any[]) {
      for (let cat of categories) {
        if (cat.id_Field === categoryId) {
          result.push(cat.id_Field);
          if (cat.children) {
            collectAllIds(cat.children);
          }
        } else if (cat.children) {
          collectIds(cat.children);
        }
      }
    }
  
    function collectAllIds(categories: any[]) {
      for (let cat of categories) {
        result.push(cat.id_Field);
        if (cat.children) {
          collectAllIds(cat.children);
        }
      }
    }
  
    collectIds(this.categories);
    return result;
  }
    
  // // Lọc thủ tục khi danh mục được chọn hoặc tìm kiếm
  // filterProcedures() {
  //   // Nếu ô tìm kiếm rỗng, reset lại filteredProcedures về procedures
  //   if (!this.searchText) {
  //     this.filteredProcedures = [...this.procedures];
  //   } else {
  //     this.filteredProcedures = this.procedures.filter(procedure => {
  //       const matchesCategory = !this.selectedCategoryId || procedure.id_Field === this.selectedCategoryId;
  //       const matchesSearchText = !this.searchText || procedure.name_procedures.toLowerCase().includes(this.searchText.toLowerCase());
  //       return matchesCategory && matchesSearchText;
  //     });
  //   }

  //   this.noProceduresMessage = this.filteredProcedures.length === 0 ? 'Không có thủ tục nào phù hợp.' : '';
  //   this.updatePagination();
  // }

  // // Lấy tất cả thủ tục
  // loadProcedures() {
  //   this.proceduresService.GetProcedures().subscribe(data => {
  //     this.procedures = data
  //       .filter(proc => proc.isVisible == true) // ✅ Chỉ lấy những thủ tục có IsVisible = true
  //       .map(proc => ({
  //         ...proc,
  //         category_name: this.getCategoryName(proc.id_Field)
  //       }));
  //     this.filterProcedures(); // Lọc danh sách hiển thị
  //   });
  // }

  // Lấy danh mục và gọi lọc thủ tục
  loadCategories(callback?: () => void) {
    this.proceduresService.GetCategoryHierarchy().subscribe(data => {
      this.categories = data;
      if (callback) {
        callback();
      }
    });
  }

  // Lấy tên danh mục theo id
  getCategoryName(id: number): string {
    let foundCategory = this.findCategoryById(this.categories, id);
    return foundCategory ? foundCategory.name_Field : 'Không xác định';
  }

  // Tìm danh mục theo id
  findCategoryById(categories: any[], id: number): any | null {
    for (let category of categories) {
      if (category.id_Field === id) return category;
      if (category.children) {
        let found = this.findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // onCategorySelect() {
  //   console.log('Selected Category ID:', this.selectedCategoryId); // Kiểm tra giá trị
  //   if (this.selectedCategoryId) {
  //     // Gọi API để lấy thủ tục theo danh mục
  //     this.proceduresService.GetProceduresByIdField(this.selectedCategoryId).subscribe(data => {
  //       console.log('Thủ tục cho danh mục đã chọn:', data);
  
  //       // Cập nhật danh sách thủ tục & gán tên danh mục
  //       this.procedures = data.map(proc => ({
  //         ...proc,
  //         category_name: this.getCategoryName(proc.id_Field) // Gán lại tên lĩnh vực
  //       }));
  
  //       // Áp dụng bộ lọc cho thủ tục sau khi cập nhật danh sách
  //       this.filterProcedures();
  //         // Cập nhật lại trang
  //         this.updatePagination();
  //       });
  //   } else {
  //     // Nếu không chọn danh mục, lọc thủ tục theo ô tìm kiếm và tải lại tất cả
  //     this.loadProcedures();
  //   }
  // }
  

  
  // Cập nhật phân trang
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProcedures.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.pagedProcedures = this.filteredProcedures.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }
  

  // Chuyển trang
  setPage(page: number) {
    this.currentPage = page;
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedProcedures = this.filteredProcedures.slice(start, start + this.pageSize);
  }
}
