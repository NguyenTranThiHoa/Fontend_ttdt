import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChangeDetectorRef } from '@angular/core';

import { Router } from '@angular/router';
import { Categogy_field } from '../categories_procedure.model';
import { CategoriesFieldeService } from '../categories_procedure.service';
import { AuthService } from '../../../../Auth/Auth.service';

@Component({
  selector: 'app-categories-field',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],
  templateUrl: './categories_procedure.component.html',
  styleUrl: './categories_procedure.component.css'
})
    
export class CategoriesFieldComponent implements OnInit {

    categories_field: Categogy_field[] = [];
    category_fieldForm: Categogy_field = {
        id_Field: 0,
        name_Field: '',
        fielParentId: null,
        selected: false,
        children: []
  };
  
    isEditMode = false;
    successMessage = '';
    page: number = 1;
    pageSize: number = 5;
    selectedCategoryId: number | null = null;
    searchQuery = '';
    isAllSelected = false;

    isLoading = false;

    constructor(
        private categories_fieldService: CategoriesFieldeService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.loadCategories_field();
    }

    loadCategories_field(): void {
        this.categories_fieldService.GetCategory_field().subscribe({
            next: (categories) => {
                this.categories_field = categories.map(category => ({ ...category, selected: false }));
                console.log('Danh sách danh mục tải về:', this.categories_field);
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Lỗi khi tải danh sách:', err)
        });
    }

    getCategoryFullName(category: Categogy_field, level: number = 0): string {
        if (category.fielParentId === null) {
            return category.name_Field;
        }
        const prefix = '---'.repeat(level);
        return `${prefix}${category.name_Field}`;
    }

    getParentName(fielParentId: number | null): string {
        if (!fielParentId) return 'Không có cha';
        const parent = this.findCategoryById(this.categories_field, fielParentId);
        return parent ? parent.name_Field : 'Không xác định';
    }

    private findCategoryById(categories: Categogy_field[], id: number): Categogy_field | undefined {
        for (const category of categories) {
            if (category.id_Field === id) return category;
            if (category.children && category.children.length > 0) {
                const found = this.findCategoryById(category.children, id);
                if (found) return found;
            }
        }
        return undefined;
    }

    get filteredCategories(): Categogy_field[] {
        if (!this.searchQuery) return this.categories_field;
        return this.filterCategories(this.categories_field, this.searchQuery.toLowerCase());
    }

    private filterCategories(categories: Categogy_field[], query: string): Categogy_field[] {
        return categories
            .map(category => {
                const matches = category.name_Field.toLowerCase().includes(query);
                const filteredChildren = category.children && category.children.length > 0
                    ? this.filterCategories(category.children, query)
                    : [];
                if (matches || filteredChildren.length > 0) {
                    return { ...category, children: filteredChildren };
                }
                return null;
            })
            .filter(category => category !== null) as Categogy_field[];
    }

    openCreateModal(): void {
        this.isEditMode = false;
        this.resetForm();
        this.showModal('categoryModal');
    }

    openEditModal(categories_field: Categogy_field): void {
        this.isEditMode = true;
        this.category_fieldForm = { ...categories_field };
        console.log('Danh mục được chọn để sửa:', this.category_fieldForm);
        this.showModal('categoryModal');
    }

    reloadPage(): void {
        window.location.reload();
    }

    onParentIdChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        // Ép kiểu parentId thành null nếu chọn "Không có cha", hoặc thành số nếu là id
        this.category_fieldForm.fielParentId = value === "null" || value === "" ? null : Number(value);
        console.log('parentId sau khi thay đổi:', this.category_fieldForm.fielParentId);
    }

    errorMessage: string = '';

    validatecategory_fieldForm(): boolean {
        this.errorMessage = ''; // Reset lỗi trước khi kiểm tra

        const nameCategory = this.category_fieldForm.name_Field?.trim();
        const fielParentId = this.category_fieldForm.fielParentId;

        // Kiểm tra không được để trống
        if (!nameCategory) {
            this.errorMessage = "Tên danh mục không được để trống!";
            return false;
        }

        if (!fielParentId && fielParentId !== null) {
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
        if (this.category_fieldForm.name_Field.startsWith(' ')) {
            this.errorMessage = "Tên danh mục không được có khoảng trắng đầu dòng!";
            return false;
        }

        return true;
    }

    saveCategories_fiels(): void {

        if (!this.validatecategory_fieldForm()) {
            return;
        }
        console.log('Dữ liệu gửi đi:', this.category_fieldForm);
        if (this.isEditMode) {
            this.categories_fieldService.UpdateCategory_field(this.category_fieldForm.id_Field, this.category_fieldForm).subscribe({
                next: () => {
                    this.loadCategories_field();
                    this.showSuccessMessage("Cập nhật danh mục thành công!");
                    this.hideModal(this.getModalInstance('categoryModal'));
                },
                error: (err) => {
                    console.error('Lỗi khi cập nhật:', err);
                    this.showSuccessMessage("Lỗi khi cập nhật danh mục: " + err.message);
                }
            });
        } else {
            this.categories_fieldService.CreateCategory_field(this.category_fieldForm).subscribe({
                next: (newCategory) => {
                    console.log('Danh mục mới từ server:', newCategory);
                    this.loadCategories_field();
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

    DeleteCategories(id: number): void {
        this.selectedCategoryId = id;
        this.showModal('deleteConfirmModal');
    }

    confirmDelete(): void {
        if (this.selectedCategoryId !== null) {
            this.categories_fieldService.DeleteCategory_field(this.selectedCategoryId).subscribe({
                next: (response) => {
                    this.categories_field = this.removeCategoryById(this.categories_field, this.selectedCategoryId!);
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

    private removeCategoryById(categories_field: Categogy_field[], id: number): Categogy_field[] {
        return categories_field
            .map(category => {
                if (category.id_Field === id) return null;
                if (category.children && category.children.length > 0) {
                    category.children = this.removeCategoryById(category.children, id);
                }
                return category;
            })
            .filter(category => category !== null) as Categogy_field[];
    }

    toggleAll(event: Event): void {
        this.isAllSelected = (event.target as HTMLInputElement).checked;
        this.setAllSelected(this.categories_field, this.isAllSelected);
    }

    private setAllSelected(categories: Categogy_field[], selected: boolean): void {
        categories.forEach(category => {
            category.selected = selected;
            if (category.children && category.children.length > 0) {
                this.setAllSelected(category.children, selected);
            }
        });
    }

    deleteSelectedCategories(): void {
        const selectedIds = this.getSelectedIds(this.categories_field);
        this.hasSelectedCategories = selectedIds.length > 0;
        this.showModal('deleteSelectedConfirmModal');
    }

    private getSelectedIds(categories: Categogy_field[]): number[] {
        let ids: number[] = [];
        categories.forEach(category => {
            if (category.selected) ids.push(category.id_Field);
            if (category.children && category.children.length > 0) {
                ids = ids.concat(this.getSelectedIds(category.children));
            }
        });
        return ids;
    }

    confirmDeleteSelected(): void {
        const selectedIds = this.getSelectedIds(this.categories_field);
        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                this.categories_fieldService.DeleteCategory_field(id).subscribe({
                    next: (response) => {
                        this.categories_field = this.removeCategoryById(this.categories_field, id);
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

    hasSelectedCategories = false;

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
        this.category_fieldForm = {
            id_Field: 0,
            name_Field: '',
            fielParentId: null,
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
        return Math.ceil(this.filteredCategories.length / this.pageSize);
    }

    getPaginationArray(): number[] {
        return Array(this.totalPages).fill(0).map((_, i) => i + 1);
    }

    truncateHTML(content: string, limit: number = 100): string {
        if (!content) return '';
        return content.length > limit ? content.substring(0, limit) + '...' : content;
    }

}