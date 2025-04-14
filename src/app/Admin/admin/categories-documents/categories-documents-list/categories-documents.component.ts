import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { Category_documents } from '../categories-documents.model';
import * as bootstrap from 'bootstrap'; // Sử dụng import này
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { ChangeDetectorRef } from '@angular/core';
import { CategoriesDocumentsService } from '../categories-documents.service';

@Component({
  selector: 'app-categories-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],  // Thêm CommonModule vào imports
  templateUrl: './categories-documents.component.html',
  styleUrl: './categories-documents.component.css'
})
export class CategoriesDocumentsComponent implements OnInit {
  category_documents: Category_documents[] = [];

  category_documentsForm: Category_documents = {
    id_category_document: 0,
    name_category_document: '',
    documentParentId: null,
    selected: false,
    children: []
  };
  
  isEditMode: boolean = false;
  successMessage: string = '';
  page: number = 1;
  pageSize: number = 5;
  selectedCategoryId: number | null = null;
  searchQuery: string = '';
  isAllSelected: boolean = false;

  constructor(
    private categoriesDocumentsService: CategoriesDocumentsService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadCategory_documents();
  }

  reloadPage(): void {
    window.location.reload();
  }

  loadCategory_documents(): void {
    this.categoriesDocumentsService.GetCategory_documents().subscribe({
      next: (category_documents) => {
        this.category_documents = category_documents.map(category_documents => ({ ...category_documents, selected: false }));
        console.log('Danh sách danh mục tải về:', this.category_documents);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi khi tải danh sách:', err)
    });
  }

  getCategoryFullName(category_documents: Category_documents, level: number = 0): string {
    if (category_documents.documentParentId === null) {
      return category_documents.name_category_document;
    }
    const prefix = '---'.repeat(level);
    return `${prefix}${category_documents.name_category_document}`;
  }

  getParentName(documentParentId: number | null): string {
    if (!documentParentId) return 'Không có cha';
    const parent = this.findCategoryById(this.category_documents, documentParentId);
    return parent ? parent.name_category_document : 'Không xác định';
  }
  
  private findCategoryById(category_documents: Category_documents[], id: number): Category_documents | undefined {
    for (const category of category_documents) {
      if (category.id_category_document === id) return category;
      if (category.children && category.children.length > 0) {
        const found = this.findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  get filteredCategory_documents(): Category_documents[] {
    if (!this.searchQuery) {
      return this.category_documents;
    }
    return this.category_documents.filter(category_documents =>
      category_documents.name_category_document.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    
  }

  private filterCategories(category_documents: Category_documents[], query: string): Category_documents[] {
    return category_documents
      .map(category => {
        const matches = category.name_category_document.toLowerCase().includes(query);
        const filteredChildren = category.children && category.children.length > 0
          ? this.filterCategories(category.children, query)
          : [];
        if (matches || filteredChildren.length > 0) {
          return { ...category, children: filteredChildren };
        }
        return null;
      })
      .filter(category => category !== null) as Category_documents[];
  }
  
  openCreateModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showModal('categoryModal');
  }


  openEditModal(category_documents: Category_documents): void {
    this.isEditMode = true;
    this.category_documentsForm = { ...category_documents };
    console.log('Danh mục được chọn để sửa:', this.category_documentsForm);
    this.showModal('categoryModal');
  }

  onParentIdChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    // Ép kiểu parentId thành null nếu chọn "Không có cha", hoặc thành số nếu là id
    this.category_documentsForm.documentParentId = value === "null" || value === "" ? null : Number(value);
    console.log('parentId sau khi thay đổi:', this.category_documentsForm.documentParentId);
  }
  
  errorMessage: string = '';

  validateCategory_documentForm(): boolean {
    this.errorMessage = ''; // Reset lỗi trước khi kiểm tra

    const nameCategory = this.category_documentsForm.name_category_document?.trim();
    const parentId = this.category_documentsForm.documentParentId;

    // Kiểm tra không được để trống
    if (!nameCategory) {
        this.errorMessage = "Tên danh mục không được để trống!";
        return false;
    }

    if (!parentId && parentId !== null) {
        this.errorMessage = "Vui lòng chọn danh mục cha!";
        return false;
    }

    // Biểu thức chính quy cho phép chữ cái có dấu, chữ số và khoảng trắng
    const regex = /^[\p{L}0-9\s]+$/u;
    if (!regex.test(nameCategory)) {
        this.errorMessage = "Tên danh mục chỉ được chứa chữ cái (có dấu), số và khoảng trắng!";
        return false;
    }

    // Kiểm tra không có khoảng trắng đầu dòng
    if (this.category_documentsForm.name_category_document.startsWith(' ')) {
        this.errorMessage = "Tên danh mục không được có khoảng trắng đầu dòng!";
        return false;
    }

    return true;
  }

  
  saveCategories_documents(): void {

    if (!this.validateCategory_documentForm()) {
      return;
    }

    console.log('Dữ liệu gửi đi:', this.category_documentsForm);
    if (this.isEditMode) {
      this.categoriesDocumentsService.UpdateCategory_documents(this.category_documentsForm.id_category_document, this.category_documentsForm).subscribe({
        next: () => {
          this.loadCategory_documents();
          this.showSuccessMessage("Cập nhật danh mục thành công!");
          this.hideModal(this.getModalInstance('categoryModal'));
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật:', err);
          this.showSuccessMessage("Lỗi khi cập nhật danh mục: " + err.message);
        }
      });
    } else {
      this.categoriesDocumentsService.CreateCategory_documents(this.category_documentsForm).subscribe({
        next: (newCategory) => {
          console.log('Danh mục mới từ server:', newCategory);
          this.loadCategory_documents();
          this.showSuccessMessage("Thêm danh mục thành công!");
          this.hideModal(this.getModalInstance('categoryModal'));
        },
        error: (err) => {
          console.error('Lỗi khi thêm:', err);
          this.showSuccessMessage("Lỗi khi thêm danh mục: " + (err.error?.message || err.message));
        }
      });
    }
  }

  DeleteCCategory_Documents(id: number): void {
    this.selectedCategoryId = id;
    this.showModal('deleteConfirmModal');
  }

  confirmDelete(): void {
    if (this.selectedCategoryId !== null) {
      this.categoriesDocumentsService.DeleteCategory_documents(this.selectedCategoryId).subscribe({
        next: (response) => {
          this.category_documents = this.removeCategoryById(this.category_documents, this.selectedCategoryId!);
          this.showSuccessMessage("Xóa danh mục thành công!");
          this.selectedCategoryId = null;
          this.hideModal(this.getModalInstance('deleteConfirmModal'));
        },
        error: (err) => {
          console.error('Lỗi khi xóa:', err);
          this.showSuccessMessage("Lỗi khi xóa danh mục: " + err.message);
        }
      });
    }
  }

  private removeCategoryById(category_documents: Category_documents[], id: number): Category_documents[] {
    return category_documents
      .map(category => {
        if (category.id_category_document === id) return null;
        if (category.children && category.children.length > 0) {
          category.children = this.removeCategoryById(category.children, id);
        }
        return category;
      })
      .filter(category => category !== null) as Category_documents[];
  }
  
  toggleAll(event: Event): void {
    this.isAllSelected = (event.target as HTMLInputElement).checked;
    this.setAllSelected(this.category_documents, this.isAllSelected);
  }

  private setAllSelected(category_documents: Category_documents[], selected: boolean): void {
    category_documents.forEach(category => {
      category.selected = selected;
      if (category.children && category.children.length > 0) {
        this.setAllSelected(category.children, selected);
      }
    });
  }

  deleteSelectedCategories(): void {
    const selectedIds = this.getSelectedIds(this.category_documents);
    this.hasSelectedCategories = selectedIds.length > 0;
    this.showModal('deleteSelectedConfirmModal');
  }

  private getSelectedIds(category_documents: Category_documents[]): number[] {
    let ids: number[] = [];
    category_documents.forEach(category => {
      if (category.selected) ids.push(category.id_category_document);
      if (category.children && category.children.length > 0) {
        ids = ids.concat(this.getSelectedIds(category.children));
      }
    });
    return ids;
  }

  confirmDeleteSelected(): void {
    const selectedIds = this.getSelectedIds(this.category_documents);
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        this.categoriesDocumentsService.DeleteCategory_documents(id).subscribe({
          next: (response) => {
            this.category_documents = this.removeCategoryById(this.category_documents, id);
            this.showSuccessMessage("Xóa danh mục thành công!");
          },
          error: (err) => {
            console.error('Lỗi khi xóa nhiều:', err);
            this.showSuccessMessage("Lỗi khi xóa danh mục: " + err.message);
          }
        });
      });
      this.hideModal(this.getModalInstance('deleteSelectedConfirmModal'));
    }
  }
  
  hasSelectedCategories: boolean = false;

  getModalInstance(modalId: string): bootstrap.Modal | null {
    const modalElement = document.getElementById(modalId);
    return modalElement ? bootstrap.Modal.getInstance(modalElement) : null;
  }

  showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    }
  }

  hideModal(modal: bootstrap.Modal | null): void {
    if (modal) modal.hide();
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  
  resetForm(): void {
    this.category_documentsForm = {
      id_category_document: 0,
      name_category_document: '',
      documentParentId: null,
      selected: false,
      children: []
    };
  }

  printPDF(): void {
    const element = document.getElementById('categoryTable');
    if (!element) return;
    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save('DanhSachDanhMuc.pdf');
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategory_documents.length / this.pageSize);
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
}
