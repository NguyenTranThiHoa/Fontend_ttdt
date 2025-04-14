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

  procedures: any[] = [];
  categories: any[] = [];
  selectedCategoryId: number | null = null; // Mặc định là tất cả
  filteredProcedures: any[] = []; // Danh sách sau khi lọc
  pagedProcedures: any[] = []; // Danh sách hiển thị theo trang
  noProceduresMessage: string = ''; // Thông báo không có thủ tục

  searchText: string = "";
    
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

  // Lọc thủ tục khi danh mục được chọn hoặc tìm kiếm
  filterProcedures() {
    // Nếu ô tìm kiếm rỗng, reset lại filteredProcedures về procedures
    if (!this.searchText) {
      this.filteredProcedures = [...this.procedures];
    } else {
      this.filteredProcedures = this.procedures.filter(procedure => {
        const matchesCategory = !this.selectedCategoryId || procedure.id_Field === this.selectedCategoryId;
        const matchesSearchText = !this.searchText || procedure.name_procedures.toLowerCase().includes(this.searchText.toLowerCase());
        return matchesCategory && matchesSearchText;
      });
    }

    this.noProceduresMessage = this.filteredProcedures.length === 0 ? 'Không có thủ tục nào phù hợp.' : '';
    this.updatePagination();
  }

  // Lấy tất cả thủ tục
  loadProcedures() {
    this.proceduresService.GetProcedures().subscribe(data => {
      this.procedures = data
        .filter(proc => proc.isVisible == true) // ✅ Chỉ lấy những thủ tục có IsVisible = true
        .map(proc => ({
          ...proc,
          category_name: this.getCategoryName(proc.id_Field)
        }));
      this.filterProcedures(); // Lọc danh sách hiển thị
    });
  }

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

  onCategorySelect() {
    console.log('Selected Category ID:', this.selectedCategoryId); // Kiểm tra giá trị
    if (this.selectedCategoryId) {
      // Gọi API để lấy thủ tục theo danh mục
      this.proceduresService.GetProceduresByIdField(this.selectedCategoryId).subscribe(data => {
        console.log('Thủ tục cho danh mục đã chọn:', data);
  
        // Cập nhật danh sách thủ tục & gán tên danh mục
        this.procedures = data.map(proc => ({
          ...proc,
          category_name: this.getCategoryName(proc.id_Field) // Gán lại tên lĩnh vực
        }));
  
        // Áp dụng bộ lọc cho thủ tục sau khi cập nhật danh sách
        this.filterProcedures();
          // Cập nhật lại trang
          this.updatePagination();
        });
    } else {
      // Nếu không chọn danh mục, lọc thủ tục theo ô tìm kiếm và tải lại tất cả
      this.loadProcedures();
    }
  }
  

  
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
