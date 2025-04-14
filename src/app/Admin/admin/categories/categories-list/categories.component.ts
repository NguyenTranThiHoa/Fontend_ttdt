import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ChangeDetectorRef } from '@angular/core';
import { Categories } from '../categories.component.model';
import { CategoriesService } from '../categories.service';

import { Router } from '@angular/router';
import { AuthService } from '../../../../Auth/Auth.service';

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],
    templateUrl: './categories.component.html',
    styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
    categories: Categories[] = [];
    categoryForm: Categories = {
        id_categories: 0,
        name_category: '',
        parentId: null,
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
        private categoriesService: CategoriesService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.categoriesService.GetCategories().subscribe({
            next: (categories) => {
                this.categories = categories.map(category => ({ ...category, selected: false }));
                console.log('Danh sách danh mục tải về:', this.categories);
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Lỗi khi tải danh sách:', err)
        });
    }

    getCategoryFullName(category: Categories, level: number = 0): string {
        if (category.parentId === null) {
            return category.name_category;
        }
        const prefix = '---'.repeat(level);
        return `${prefix}${category.name_category}`;
    }

    getParentName(parentId: number | null): string {
        if (!parentId) return 'Không có cha';
        const parent = this.findCategoryById(this.categories, parentId);
        return parent ? parent.name_category : 'Không xác định';
    }

    private findCategoryById(categories: Categories[], id: number): Categories | undefined {
        for (const category of categories) {
            if (category.id_categories === id) return category;
            if (category.children && category.children.length > 0) {
                const found = this.findCategoryById(category.children, id);
                if (found) return found;
            }
        }
        return undefined;
    }

    get filteredCategories(): Categories[] {
        if (!this.searchQuery) return this.categories;
        return this.filterCategories(this.categories, this.searchQuery.toLowerCase());
    }

    private filterCategories(categories: Categories[], query: string): Categories[] {
        return categories
            .map(category => {
                const matches = category.name_category.toLowerCase().includes(query);
                const filteredChildren = category.children && category.children.length > 0
                    ? this.filterCategories(category.children, query)
                    : [];
                if (matches || filteredChildren.length > 0) {
                    return { ...category, children: filteredChildren };
                }
                return null;
            })
            .filter(category => category !== null) as Categories[];
    }

    openCreateModal(): void {
        this.isEditMode = false;
        this.resetForm();
        this.showModal('categoryModal');
    }

    openEditModal(categories: Categories): void {
        this.isEditMode = true;
        this.categoryForm = { ...categories };
        console.log('Danh mục được chọn để sửa:', this.categoryForm);
        this.showModal('categoryModal');
    }

    reloadPage(): void {
        window.location.reload();
    }

    onParentIdChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        // Ép kiểu parentId thành null nếu chọn "Không có cha", hoặc thành số nếu là id
        this.categoryForm.parentId = value === "null" || value === "" ? null : Number(value);
        console.log('parentId sau khi thay đổi:', this.categoryForm.parentId);
    }

    // saveCategories(): void {
    //     console.log('Dữ liệu gửi đi:', this.categoryForm);
    //     if (this.isEditMode) {
    //         this.categoriesService.UpdateCategories(this.categoryForm.id_categories, this.categoryForm).subscribe({
    //             next: () => {
    //                 this.loadCategories();
    //                 this.showSuccessMessage("Cập nhật danh mục thành công!");
    //                 this.hideModal(this.getModalInstance('categoryModal'));
    //             },
    //             error: (err) => {
    //                 console.error('Lỗi khi cập nhật:', err);
    //                 this.showSuccessMessage("Lỗi khi cập nhật danh mục: " + err.message);
    //             }
    //         });
    //     } else {
    //         this.categoriesService.CreateCategories(this.categoryForm).subscribe({
    //             next: (newCategory) => {
    //                 console.log('Danh mục mới từ server:', newCategory);
    //                 this.loadCategories();
    //                 this.showSuccessMessage("Thêm danh mục thành công!");
    //                 this.hideModal(this.getModalInstance('categoryModal'));
    //             },
    //             error: (err) => {
    //                 console.error('Lỗi khi thêm:', err);
    //                 this.showSuccessMessage("Lỗi khi thêm danh mục: " + (err.error?.message || err.message));
    //             }
    //         });
    //     }
    // }

    errorMessage: string = '';

    validateCategoryForm(): boolean {
        this.errorMessage = ''; // Reset lỗi trước khi kiểm tra

        const nameCategory = this.categoryForm.name_category?.trim();
        const parentId = this.categoryForm.parentId;

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
        if (this.categoryForm.name_category.startsWith(' ')) {
            this.errorMessage = "Tên danh mục không được có khoảng trắng đầu dòng!";
            return false;
        }

        return true;
    }

    saveCategories(): void {
        if (!this.validateCategoryForm()) {
            return;
        }

        console.log('Dữ liệu gửi đi:', this.categoryForm);
        if (this.isEditMode) {
            this.categoriesService.UpdateCategories(this.categoryForm.id_categories, this.categoryForm).subscribe({
                next: () => {
                    this.loadCategories();
                    this.errorMessage = ''; // Xóa lỗi sau khi thành công
                    this.showSuccessMessage("Cập nhật danh mục thành công!");
                    this.hideModal(this.getModalInstance('categoryModal'));
                },
                error: (err) => {
                    console.error('Lỗi khi cập nhật:', err);
                    this.errorMessage = "Lỗi khi cập nhật danh mục: " + err.message;
                }
            });
        } else {
            this.categoriesService.CreateCategories(this.categoryForm).subscribe({
                next: (newCategory) => {
                    console.log('Danh mục mới từ server:', newCategory);
                    this.loadCategories();
                    this.errorMessage = ''; // Xóa lỗi sau khi thành công
                    this.showSuccessMessage("Thêm danh mục thành công!");
                    this.hideModal(this.getModalInstance('categoryModal'));
                },
                error: (err) => {
                    console.error('Lỗi khi thêm:', err);
                    this.errorMessage = "Lỗi khi thêm danh mục: " + (err.error?.message || err.message);
                }
            });
        }
    }


    DeleteCategories(id: number): void {
        this.selectedCategoryId = id;
        this.showModal('deleteConfirmModal');
        this.loadCategories();
    }

    confirmDelete(): void {
        if (this.selectedCategoryId !== null) {
            this.categoriesService.DeleteCategory(this.selectedCategoryId).subscribe({
                next: () => {
                    this.categories = this.removeCategoryById(this.categories, this.selectedCategoryId!);
                    this.showSuccessMessage("Xóa danh mục thành công!");
                    this.selectedCategoryId = null;
                    this.hideModal(this.getModalInstance('deleteConfirmModal'));
                    this.loadCategories(); // Gọi lại để tải danh sách mới
                },
                error: (err) => {
                    console.error('Lỗi khi xóa:', err);
                    this.showSuccessMessage("Lỗi khi xóa danh mục: " + err.message);
                }
            });
        }
    }

    private removeCategoryById(categories: Categories[], id: number): Categories[] {
        return categories
            .map(category => {
                if (category.id_categories === id) return null;
                if (category.children && category.children.length > 0) {
                    category.children = this.removeCategoryById(category.children, id);
                }
                return category;
            })
            .filter(category => category !== null) as Categories[];
    }

    toggleAll(event: Event): void {
        this.isAllSelected = (event.target as HTMLInputElement).checked;
        this.setAllSelected(this.categories, this.isAllSelected);
    }

    private setAllSelected(categories: Categories[], selected: boolean): void {
        categories.forEach(category => {
            category.selected = selected;
            if (category.children && category.children.length > 0) {
                this.setAllSelected(category.children, selected);
            }
        });
    }

    deleteSelectedCategories(): void {
        const selectedIds = this.getSelectedIds(this.categories);
        this.hasSelectedCategories = selectedIds.length > 0; // Kiểm tra có danh mục nào được chọn
        if (this.hasSelectedCategories) {
            this.showModal('deleteSelectedConfirmModal');
        } else {
            this.showSuccessMessage("Vui lòng chọn ít nhất một danh mục để xóa!");
        }
    }

    private getSelectedIds(categories: Categories[]): number[] {
        let ids: number[] = [];
        categories.forEach(category => {
            if (category.selected) ids.push(category.id_categories);
            if (category.children && category.children.length > 0) {
                ids = ids.concat(this.getSelectedIds(category.children));
            }
        });
        return ids;
    }

    confirmDeleteSelected(): void {
        const selectedIds = this.getSelectedIds(this.categories);
        if (selectedIds.length > 0) {
            const deleteRequests = selectedIds.map(id => 
                this.categoriesService.DeleteCategory(id).pipe(
                    catchError(err => {
                        this.showSuccessMessage("Lỗi khi xóa danh mục ID " + id + ": " + err.message);
                        return of(null);
                    })
                )
            );

            forkJoin(deleteRequests).subscribe(() => {
                this.categories = this.categories.filter(category => !selectedIds.includes(category.id_categories));
                this.showSuccessMessage("Xóa các danh mục thành công!");
                this.hideModal(this.getModalInstance('deleteSelectedConfirmModal'));
                this.loadCategories();
            });
        } else {
            this.showSuccessMessage("Vui lòng chọn ít nhất một danh mục để xóa!");
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
        this.categoryForm = {
            id_categories: 0,
            name_category: '',
            parentId: null,
            selected: false,
            children: []
        };
    }

    // printPDF(): void {
    //     const element = document.getElementById('categoryTable');
    //     if (!element) return;
    //     html2canvas(element).then(canvas => {
    //         const imgData = canvas.toDataURL('image/png');
    //         const pdf = new jsPDF('p', 'mm', 'a4');
    //         const imgWidth = 190;
    //         const imgHeight = (canvas.height * imgWidth) / canvas.width;
    //         pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    //         pdf.save('DanhSachDanhMuc.pdf');
    //     });
    // }

    printPDF(): void {
        const doc = new jsPDF();

        // Font mặc định, cần font hỗ trợ Unicode (Roboto, Times New Roman,...)
        doc.setFont("Times New Roman", "normal");

        // Tiêu đề
        doc.setFontSize(16);
        doc.text("DANH MUC TIN TUC - SU KIEN", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.text("(Trang thong tin dien tu xa phuong)", 105, 28, { align: "center" });

        // Thời gian in
        const now = new Date();
        const formattedDate = now.toLocaleString("vi-VN");
        doc.setFontSize(10);
        doc.text(`Ngày in: ${formattedDate}`, 14, 40);

        // Dữ liệu bảng
        const tableData = this.getCategoryTableData();

        autoTable(doc, {
            startY: 50,
            head: [["STT", "Tên danh mục", "Danh mục cha"]],
            body: tableData,
            theme: "grid",
            styles: { font: "times", fontSize: 10 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Header xanh
            alternateRowStyles: { fillColor: [240, 240, 240] }, // Dòng xen kẽ
        });

        doc.save("DanhSachDanhMuc.pdf");
    }

    getCategoryTableData(): any[] {
        let index = 1;
        const tableData: any[] = [];

        const processCategory = (category: any) => {
            tableData.push([
                index++, 
                category.name_category, 
                category.parentId ? this.getParentName(category.parentId) : "Không có cha", 
            ]);

            if (category.children && category.children.length > 0) {
                category.children.forEach(processCategory);
            }
        };

        this.filteredCategories.forEach(processCategory);

        return tableData;
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


