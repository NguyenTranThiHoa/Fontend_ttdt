import { Component, OnInit, ChangeDetectorRef, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Router } from '@angular/router';
import { AuthService } from '../../../../Auth/Auth.service';

import { Categories_introduce } from '../categories-introduce.model';
import { Introduce } from '../introduce.model';
import { CategoriesIntroduceService } from '../categories-introduce.service';

import { QuillModule } from 'ngx-quill';
import Quill from 'quill';
import { Folder } from '../../uploadfileImage/folder.model';
import { PostImage } from '../../uploadfileImage/postImage.model';
import { UploadfileImageService } from '../../uploadfileImage/uploadImage.service';

@Component({
  selector: 'app-categories-introduce',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule, QuillModule],
  templateUrl: './categories-introduce.component.html',
  styleUrls: ['./categories-introduce.component.css']
})
export class CategoriesIntroduceComponent implements OnInit{
    categories_introduce: Categories_introduce[] = [];
    
    category_introduceForm: Categories_introduce = {
        id_cate_introduce: 0,
        name_cate_introduce: '',
        selected: false,
    };

    introduce: Introduce[] = [];
    
    introduceForm: Introduce = {
        id_introduce: 0,
        name_introduce: '',
        id_cate_introduce: 0, 
        formatHTML: '',
        description: '',
        create_at: '',
        image_url: '',
        selected: false,
    }
  
    isEditMode: boolean = false;
    isEdit_Mode: boolean = false;

    successMessage: string = '';
    page: number = 1;
    pageSize: number = 6;

    selectedCategoryId: number | null = null;
    searchQuery = '';
    searchQuery1 = '';

    isAllSelected = false;

  constructor(
      private categories_introduceService: CategoriesIntroduceService,
      private cdr: ChangeDetectorRef,
      private router: Router,
      private authService: AuthService,
        private renderer: Renderer2,
        private uploadService: UploadfileImageService,
  ) { }

    ngOnInit(): void {
        this.loadCategories_introduce();
        this.loadIntroduce();
        this.loadFolder();
        this.loadPostImage();
    }

    loadCategories_introduce(): void {
        this.categories_introduceService.GetCategories_introduces().subscribe(categories_introduce => {
        this.categories_introduce = categories_introduce.map(category => ({ ...category, selected: false }));
        });
    }

    loadIntroduce(): void {
        this.categories_introduceService.GetIntroduce().subscribe(introduce => {
            this.introduce = introduce.map(category => ({ ...category, selected: false }));
            this.cdr.detectChanges(); // Đảm bảo Angular nhận biết sự thay đổi
        });
    }


    get filteredCategories_introduce(): Categories_introduce[] {
        if (!this.searchQuery1) {
            return this.categories_introduce;
        }
            return this.categories_introduce.filter(categoriess =>
                categoriess.name_cate_introduce.toLowerCase().includes(this.searchQuery1.toLowerCase()) 
        );    
    }
    

    get filteredIntroduce(): Introduce[] {
        if (!this.searchQuery) {
            return this.introduce;
        }
        return this.introduce.filter(item =>
            item.name_introduce.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    }

    openCreateModal(): void {
        this.isEditMode = false;
        this.resetForm();
        this.showModal('categoryModal');
    }

    openEditModal(categories_introduce: Categories_introduce): void {
        this.isEditMode = true;
        this.category_introduceForm = { ...categories_introduce };
        this.showModal('categoryModal');
    }
    
    openCreate_Modal(): void {
        this.isEdit_Mode = false;
        this.resetForm();
        this.showModal('category_Modal');
    }
    
    openEdit_Modal(introduce: Introduce): void {
        this.isEdit_Mode = true;
        this.introduceForm = { ...introduce };
        this.imagePreview = introduce.image_url ? 'https://localhost:7253/api/images/' + introduce.image_url : null;
        this.introduceForm.description = introduce.formatHTML; // Gán giá trị của formatHTML vào biến quillContent
        console.log('Danh sách được chọn để sửa:', this.introduceForm);
        this.showModal('category_Modal');
    }

    reloadPage(): void {
        window.location.reload();
    }

    validateCategoryForm(): boolean {
        this.errorMessage = ''; // Reset lỗi trước khi kiểm tra

        const nameCategory = this.category_introduceForm.name_cate_introduce?.trim();

        // Kiểm tra không được để trống
        if (!nameCategory) {
            this.errorMessage = "Tên danh mục giới thiệu không được để trống!";
            return false;
        }

        // Biểu thức chính quy cho phép chữ cái có dấu, chữ số và khoảng trắng
        const regex = /^[\p{L}0-9\s]+$/u;
        if (!regex.test(nameCategory)) {
            this.errorMessage = "Tên danh mục giới thiệu chỉ được chứa chữ cái (có dấu), số và khoảng trắng!";
            return false;
        }

        // Kiểm tra không có khoảng trắng đầu dòng
        if (this.category_introduceForm.name_cate_introduce.startsWith(' ')) {
            this.errorMessage = "Tên danh mục không được có khoảng trắng đầu dòng!";
            return false;
        }

        return true;
    }

    saveCategories_introduce(): void {

        if (!this.validateCategoryForm()) {
            return;
        }

        console.log('Dữ liệu gửi đi:', this.category_introduceForm);
        if (this.isEditMode) {
            this.categories_introduceService.UpdateCategories_introduces(this.category_introduceForm.id_cate_introduce, this.category_introduceForm).subscribe({
                next: () => {
                    this.loadCategories_introduce();
                    this.showSuccessMessage("Cập nhật danh mục thành công!");
                    this.hideModal(this.getModalInstance('categoryModal'));
                },
                error: (err) => {
                    console.error('Lỗi khi cập nhật:', err);
                    this.showSuccessMessage("Lỗi khi cập nhật danh mục: " + err.message);
                }
            });
        } else {
            this.categories_introduceService.CreateCategories_introduces(this.category_introduceForm).subscribe({
                next: (newCategory) => {
                    console.log('Danh mục mới từ server:', newCategory);
                    this.loadCategories_introduce();
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
  
    validateIntroducesForm(): boolean {
        this.errorMessage = ''; // Reset lỗi trước khi kiểm tra

        const title = this.introduceForm.name_introduce?.trim();
        const categoryId = this.introduceForm.id_cate_introduce;
        const content = this.introduceForm.description?.trim();
        const image = this.selectedImageName1;

        // Kiểm tra Tiêu đề Tin tức
        if (!title) {
            this.errorMessage = "Tên thông tin giới thiệu không được để trống!";
            return false;
        }
        
        // Biểu thức chính quy cho phép chữ cái có dấu, chữ số và khoảng trắng
        const regex = /^[\p{L}0-9\s]+$/u;
        if (!regex.test(title)) {
            this.errorMessage = "Tên thông tin giới thiệu chỉ được chứa chữ cái (có dấu), và khoảng trắng!";
            return false;
        }

        // Kiểm tra Danh mục
        if (!categoryId) {
            this.errorMessage = "Vui lòng chọn danh mục giới thiệu!";
            return false;
        }

        // Kiểm tra Nội dung Chính
        if (!content) {
            this.errorMessage = "Nội dung chính không được để trống!";
            return false;
        }

        // Kiểm tra Hình ảnh
        if (!image) {
            this.errorMessage = "Vui lòng chọn hình ảnh!";
            return false;
        }

        return true;
    }
    
    saveIntroduce(): void {
        
        if (!this.validateIntroducesForm()) {
        return;
        }
        const plainText = this.stripHtml(this.introduceForm.description);
        const formattedText = this.introduceForm.description;

        if (this.isEdit_Mode) {
            console.log('Chế độ chỉnh sửa cho Introduce');
            console.log('Dữ liệu gửi đi:', { ...this.introduceForm, description: plainText, formatHTML: formattedText });
            this.categories_introduceService.UpdateIntroduce(
                this.introduceForm.id_introduce,
                { ...this.introduceForm, description: plainText, formatHTML: formattedText }
            ).subscribe(() => {
                this.loadIntroduce();
                this.showSuccessMessage("Cập nhật thành công!");
                this.hideModal(this.getModalInstance('category_Modal'));
            }, error => {
                console.error("Lỗi khi cập nhật:", error);
                this.showSuccessMessage("Lỗi khi cập nhật: " + error.message);
            });
        } else {
            console.log('Chế độ thêm mới cho Introduce');
            console.log('Dữ liệu gửi đi:', {
                ...this.introduceForm,
                description: plainText,
                formatHTML: formattedText
            });
            this.categories_introduceService.CreateIntroduce({
                ...this.introduceForm,
                description: plainText,
                formatHTML: formattedText
            }).subscribe((newIntroduce) => {
                this.introduce.push({ ...newIntroduce, selected: false });
                this.showSuccessMessage("Thêm thành công!");
                this.hideModal(this.getModalInstance('category_Modal'));
            }, error => {
                console.error("Lỗi khi thêm mới:", error);
                this.showSuccessMessage("Lỗi khi thêm mới: " + error.message);
            });
        }
    }

    stripHtml(html: string): string {
        if (!html) return '';
        return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
    }

    DeleteCategories_introduce(id: number): void {
        this.selectedCategoryId = id;
        this.showModal('deleteConfirmModal');
    }
  
    DeleteIntroduce(id: number): void {
        this.selectedCategoryId = id;
        this.showModal('deleteConfirm_Modal');
    }

    confirmDelete(): void {
        if (this.selectedCategoryId !== null) {
        this.categories_introduceService.DeleteCategories_introduces(this.selectedCategoryId).subscribe(() => {
            this.categories_introduce = this.categories_introduce.filter(c => c.id_cate_introduce !== this.selectedCategoryId);
            this.showSuccessMessage("Xóa danh mục thành công!");
            this.selectedCategoryId = null;
        });
        }
    }

    confirm_Delete(): void {
        if (this.selectedCategoryId !== null) {
        this.categories_introduceService.DeleteIntroduce(this.selectedCategoryId).subscribe(() => {
            this.introduce = this.introduce.filter(c => c.id_introduce !== this.selectedCategoryId);
            this.showSuccessMessage("Xóa danh sách thành công!");
            this.selectedCategoryId = null;
        });
        }
    }

    toggleAll(event: Event): void {
        this.isAllSelected = (event.target as HTMLInputElement).checked;
        this.categories_introduce.forEach(category => category.selected = this.isAllSelected);
    }

    toggle_All(event: Event): void {
        this.isAllSelected = (event.target as HTMLInputElement).checked;
        this.introduce.forEach(category => category.selected = this.isAllSelected);
    }

    hasSelectedCategories: boolean = false;
    
    deleteSelectedCategories(): void {
        const selectedIds = this.categories_introduce.filter(category => category.selected).map(category => category.id_cate_introduce);
        this.hasSelectedCategories = selectedIds.length > 0;
    
        if (!this.hasSelectedCategories) {
            // Nếu không có danh mục nào được chọn, hiển thị modal với thông báo
            this.showModal('deleteSelectedConfirmModal');
        } else {
            // Nếu có danh mục được chọn, hiển thị modal xác nhận
            this.showModal('deleteSelectedConfirmModal');
        }
    }

    hasSelected_Categories: boolean = false;

    deleteSelected_Categories(): void {
        const selectedIds = this.introduce.filter(category => category.selected).map(category => category.id_introduce);
        this.hasSelected_Categories = selectedIds.length > 0;

        if (!this.hasSelected_Categories) {
            // Nếu không có danh mục nào được chọn, hiển thị modal với thông báo
            this.showModal('deleteSelectedConfirm_Modal');
        } else {
            // Nếu có danh mục được chọn, hiển thị modal xác nhận
            this.showModal('deleteSelectedConfirm_Modal');
        }
    }

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
        if (modal) {
        modal.hide();
        }
    }

    showSuccessMessage(message: string): void {
        this.successMessage = message;
        setTimeout(() => this.successMessage = '', 3000);
    }

    confirmDeleteSelected(): void {
        const selectedIds = this.categories_introduce.filter(category => category.selected).map(category => category.id_cate_introduce);
        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                this.categories_introduceService.DeleteCategories_introduces(id).subscribe(() => {
                    this.categories_introduce = this.categories_introduce.filter(category => !selectedIds.includes(category.id_cate_introduce));
                    this.showSuccessMessage("Xóa danh mục đã chọn thành công!");
                });
            });
        }
    }

    confirmDelete_Selected(): void {
        const selectedIds = this.introduce.filter(category => category.selected).map(category => category.id_introduce);
        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                this.categories_introduceService.DeleteIntroduce(id).subscribe(() => {
                    this.introduce = this.introduce.filter(category => !selectedIds.includes(category.id_introduce));
                    this.showSuccessMessage("Xóa danh sách đã chọn thành công!");
                });
            });
        }
    }

    resetForm(): void {
        this.category_introduceForm = {
          id_cate_introduce: 0,
          name_cate_introduce: '',
          selected: false,
        };
        this.introduceForm = {
            id_introduce: 0,
            name_introduce: '',
            id_cate_introduce: 0,
            formatHTML: '',
            description: '',
            create_at: new Date().toISOString(),
            image_url: '',
            selected: false,
        }
        this.imagePreview = null;
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
        return Math.ceil(this.filteredCategories_introduce.length / this.pageSize);
    }

    get total_Pages(): number {
        return Math.ceil(this.filteredIntroduce.length / this.pageSize);
    }

    getPaginationArray(): number[] {
        return Array(this.totalPages).fill(0).map((_, i) => i + 1);
    }
  
    get_PaginationArray(): number[] {
        return Array(this.total_Pages).fill(0).map((_, i) => i + 1);
    }

    activeTab: string = 'parent';

    getCategories_Name(id_cate_introduce: number): string {
        const category = this.categories_introduce.find((loc) => loc.id_cate_introduce === id_cate_introduce);
        return category ? category.name_cate_introduce : 'Không xác định';
    }

    imagePreview: string | null = null;

    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input?.files?.[0]) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('imageFile', file);

        this.categories_introduceService.UploadImage(formData).subscribe(response => {
            this.introduceForm.image_url = response.imagePath;
            const reader = new FileReader();
            reader.onload = () => {
            this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }, error => {
            console.error('Lỗi khi tải lên hình ảnh:', error);
        });
        }
    }

    /*************************************Editor***************************/
    quillEditorInstance: any;

    @ViewChild('quillEditor', { static: false }) quillEditorRef!: ElementRef;
    quillEditor: Quill | null = null;
    
    quillConfig = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['code-block'],
        ['formula'],
        ['clean'],
        ['blockquote'],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ table: 'custom' }], // Thêm nút "Table"
      ],

      handlers: {
        undo: () => this.quillEditor?.history.undo(),
        redo: () => this.quillEditor?.history.redo(),
        table: () => this.openTableModal(), // Mở modal khi nhấn vào nút Table  
        image: () => this.openImageSelectorModal(),
        
      }          
    },
        theme: 'snow',
        placeholder: 'Nhập nội dung...',
        readOnly: false,
    };

    quillFormats = [
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'script', 'indent',
        'size', 'color', 'background', 'align',
        'link', 'image', 'video',
        'table',
        'code-block',
        'formula',
        'blockquote',
        'header',
        'font',
        'history',
    ];

    onEditorCreated(quill: any): void {
        this.quillEditor = quill;
        setTimeout(() => {
        const toolbar = quill.getModule('toolbar') as any;
        this.quillEditorInstance = quill;

        if (toolbar) {
            // ✅ Thêm nút Undo
            const undoButton = document.createElement('button');
            undoButton.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i>'; 
            undoButton.title = 'Hoàn tác';
            undoButton.onclick = () => quill.history.undo();
            toolbar.container.appendChild(undoButton);

            // ✅ Thêm nút Redo
            const redoButton = document.createElement('button');
            redoButton.innerHTML = '<i class="bi bi-arrow-clockwise"></i>'; 
            redoButton.title = 'Làm lại';
            redoButton.onclick = () => quill.history.redo();
            toolbar.container.appendChild(redoButton);
        }

        if (toolbar) {
            toolbar.addHandler('table', () => this.openTableModal()); // Gọi modal nhập số hàng/cột
        } else {
            console.error('Không tìm thấy toolbar hoặc addHandler không tồn tại.');
        }

        }, 500);
    }

    showTableModal = false;  // Biến kiểm soát modal
    rows: number = 3; // Giá trị mặc định
    cols: number = 3;

    /** 🏷 Mở modal thêm bảng */
    openTableModal(): void {
        this.showTableModal = true;
        console.log("📌 Mở modal, giá trị hiện tại:", this.rows, "x", this.cols);
    }

    /** 🏷 Đóng modal */
    closeTableModal(): void {
        this.showTableModal = false;
    }

    /** 🏷 Cập nhật số hàng từ input */
    updateRows(event: any): void {
        const value = parseInt(event.target.value, 10);
        this.rows = isNaN(value) || value < 1 ? 1 : value;
        console.log("✅ Số hàng cập nhật:", this.rows);
    }

    /** 🏷 Cập nhật số cột từ input */
    updateCols(event: any): void {
        const value = parseInt(event.target.value, 10);
        this.cols = isNaN(value) || value < 1 ? 1 : value;
        console.log("✅ Số cột cập nhật:", this.cols);
    }

    /** 🏷 Chèn bảng vào Quill Editor */
    insertCustomTable(): void {
        console.log("📌 Giá trị cuối cùng nhập vào:", this.rows, "x", this.cols);

        if (!this.rows || !this.cols || this.rows < 1 || this.cols < 1) {
        alert("Vui lòng nhập số hàng và số cột hợp lệ!");
        return;
        }

        let tableHtml = "<table style='border-collapse: collapse; width: 100%; text-align: center;'>";

        for (let i = 0; i < this.rows; i++) {
        tableHtml += "<tr>";
        for (let j = 0; j < this.cols; j++) {
            tableHtml += "<td style='border: 1px solid #000; padding: 8px;'><br></td>";
        }
        tableHtml += "</tr>";
        }

        tableHtml += "</table>";

        const quill = this.quillEditorInstance;
        if (quill) {
        const range = quill.getSelection(true);
        quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
        console.log("✅ Bảng đã được chèn vào Quill Editor");
        } else {
        console.error("❌ Quill Editor chưa được khởi tạo!");
        }

        this.showTableModal = false; // Đóng modal sau khi chèn bảng
    }

    /*********************************************************Chọn ảnh từ giao diện****************************************************/
        activeFolderId: number | null = null; // Thêm thuộc tính này

        selectedFolder: Folder | null = null;
        newFolderName: string = '';
        renameFolderName: string = '';
        private _filteredPostImage: PostImage[] = [];
    
        // Phương thức để mở rộng/thu gọn thư mục
        toggleFolder(folder: Folder): void {
            folder.isExpanded = !folder.isExpanded; // Đảo trạng thái mở rộng/thu gọn
        }
    
        selectFolder(folder: Folder): void {
            this.activeFolderId = folder.id_folder; // Cập nhật ID thư mục đang được chọn
            this.selectedFolder = folder; // Cập nhật thư mục được chọn
            this._filteredPostImage = this.images.filter(image => image.id_folder === folder.id_folder); // Lọc hình ảnh theo thư mục
            console.log('Thư mục được chọn:', folder); // Debug dữ liệu
            console.log('Hình ảnh được lọc:', this._filteredPostImage); // Debug dữ liệu
        }
    
        folder: Folder[] = [];
        folderForm: Folder = {
            id_folder: 0,
            name_folder: '',
            parentId: null,
            children: [],
            createdAt: ''
        };
    
        images: PostImage[] = [];
        imageForm: PostImage = {
            id_Image: 0,
            fileName: '',           
            filePath: '',
            id_folder: 0,         
            uploadedAt: ''    
        }
    
        
    errorMessage: string = '';
    
        loadFolder(): void {
            this.uploadService.GetFolder().subscribe({
                next: (categories) => {
                    this.folder = categories.map(category => ({ ...category }));
                    console.log('Danh sách thư mục:', this.folder); // Debug dữ liệu
                    this.cdr.detectChanges();
                },
                error: (err) => console.error('Lỗi khi tải danh sách thư mục:', err)
            });
        }
    
        loadPostImage(): void {
            this.uploadService.GetImages().subscribe(images => {
                this.images = images.map(ne => ({ ...ne, selected: false }));
                this._filteredPostImage = [...this.images]; // Khởi tạo danh sách đã lọc
                console.log('Danh sách hình ảnh:', this.images); // Debug dữ liệu
                this.cdr.detectChanges();
            });
        }
    
        // Lưu thư mục (thêm mới hoặc cập nhật)
        saveFolder(): void {
            if (this.isEditMode) {
                // Cập nhật thư mục
                this.uploadService.UpdateFolder(this.folderForm.id_folder, this.folderForm).subscribe({
                    next: () => {
                        this.loadFolder(); // Tải lại danh sách thư mục
                        this.showSuccessMessage("Cập nhật thư mục thành công!");
                        this.hideModal(this.getModalInstance('folderModal'));
                    },
                    error: (err) => {
                        console.error('Lỗi khi cập nhật:', err);
                        this.showErrorMessage("Lỗi khi cập nhật thư mục: " + err.message);
                    }
                });
            } else {
                // Thêm mới thư mục
                this.uploadService.CreateFolder(this.folderForm).subscribe({
                    next: (newFolder) => {
                        this.loadFolder(); // Tải lại danh sách thư mục
                        this.showSuccessMessage("Thêm thư mục thành công!");
                        this.hideModal(this.getModalInstance('folderModal'));
                    },
                    error: (err) => {
                        console.error('Lỗi khi thêm:', err);
                        this.showErrorMessage("Lỗi khi thêm thư mục: " + (err.error?.message || err.message));
                    }
                });
            }
        }
    
        // Phương thức để hiển thị tên thư mục đầy đủ (bao gồm cả phân cấp)
        getFolderFullName(folder: Folder, level: number): string {
            let prefix = '—'.repeat(level * 3);
            return `${prefix} ${folder.name_folder}`;
        }
    
        get filteredPostImage(): PostImage[] {
            return this._filteredPostImage;
        }
    
        get filteredFolder(): Folder[] {
            if (!this.searchQuery) return this.folder;
            return this.filterFolder(this.folder, this.searchQuery.toLowerCase());
        }
    
        private filterFolder(folder: Folder[], query: string): Folder[] {
            return folder
                .map(category => {
                    const matches = category.name_folder.toLowerCase().includes(query);
                    const filteredChildren = category.children && category.children.length > 0
                        ? this.filterFolder(category.children, query)
                        : [];
                    if (matches || filteredChildren.length > 0) {
                        return { ...category, children: filteredChildren };
                    }
                    return null;
                })
                .filter(category => category !== null) as Folder[];
        }

        // Hiển thị thông báo lỗi
        showErrorMessage(message: string): void {
            this.errorMessage = message;
            setTimeout(() => {
                this.errorMessage = '';
            }, 3000);
        }
    
        // Phương thức encodeURIComponent
        encodeURI(url: string): string {
            return encodeURI(url);
        }
    
        selectedFolderId: number | null = null; // ID thư mục được chọn
        selectedFile: File | null = null; // File ảnh được chọn
    
        // Xử lý khi người dùng chọn ảnh
        onImageSelected1(event: any): void {
            const file = event.target.files[0];
            if (file) {
                this.selectedFile = file;
    
                // Hiển thị preview ảnh
                const reader = new FileReader();
                reader.onload = () => {
                    this.imagePreview = reader.result as string;
                };
                reader.readAsDataURL(file);
            }
        }
    
        // Xử lý upload ảnh
        uploadImage(): void {
        if (!this.selectedFile) {
            this.showSuccessMessage("Vui lòng chọn một tệp ảnh!");
            return;
        }
        
        if (!this.selectedFolderId) {
            this.showSuccessMessage("Vui lòng chọn thư mục!");
            return;
        }
    
        // Gọi API upload ảnh
        this.uploadService.uploadImage(this.selectedFile, this.selectedFolderId).subscribe({
            next: (image) => {
            this.showSuccessMessage("Upload ảnh thành công!");
            this.resetForm(); // Reset form sau khi upload thành công
            this.loadPostImage();
            this.loadFolder();
            },
            error: (err) => {
            console.error('Lỗi khi upload ảnh:', err);
            this.showErrorMessage("Lỗi khi upload ảnh: " + err.message);
            }
        });
        }
        
        openImageSelectorModal() {
        const modalElement = document.getElementById('imageSelectorModal');
            if (modalElement) {
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
            } else {
            console.error("Không tìm thấy modal với ID 'imageSelectorModal'");
            }
        }

    
    insertImageToEditor(imageUrl: string) {
    const quill = this.quillEditorInstance;
    
    if (quill) {
        const range = quill.getSelection(true); // ✅ Lấy vị trí con trỏ hiện tại
        if (range) {
        quill.insertEmbed(range.index, 'image', `https://localhost:7253/api/images/${imageUrl}`);
        quill.setSelection(range.index + 1); // ✅ Di chuyển con trỏ sau ảnh
        }

        // ✅ Cập nhật nội dung `news_eventsForm.content`
        this.introduceForm.description = quill.root.innerHTML;
    }

    // ✅ Ẩn modal sau khi chọn ảnh
    const imageModalElement = document.getElementById('imageSelectorModal');
    if (imageModalElement) {
        const imageModalInstance = bootstrap.Modal.getInstance(imageModalElement) || new bootstrap.Modal(imageModalElement);
        imageModalInstance.hide();
    }

    console.log("✅ Ảnh đã chèn vào Quill:", `https://localhost:7253/api/images/${imageUrl}`);
    }

    selectedImageName: string = "";

    selectImage(imagePath: string, imageName: string) {
    this.selectedImageName = imageName;
    this.imagePreview = `https://localhost:7253/api/images/${imagePath}`;

    // Ẩn modal sau khi chọn ảnh
    const modalElement = document.getElementById('imageSelectorModal');
    if (modalElement) {
        (new bootstrap.Modal(modalElement)).hide();
    }
    }

    openImageSelectorModal1() {
    const modalElement = document.getElementById('imageSelectorModal1');
    if (modalElement) {
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
    } else {
        console.error("Không tìm thấy modal với ID 'imageSelectorModal1'");
    }
    }

    selectedImageName1: string = "";

    selectImage1(imagePath: string, imageName: string) {
    // Lưu đường dẫn ảnh vào form
    this.introduceForm.image_url = imagePath;

    // Hiển thị tên ảnh trong input
    this.selectedImageName1 = imageName;

    // Hiển thị ảnh xem trước
    this.imagePreview = `https://localhost:7253/api/images/${imagePath}`;

    // Ẩn modal sau khi chọn ảnh
    const modalElement = document.getElementById('imageSelectorModal1');
    if (modalElement) {
        (new bootstrap.Modal(modalElement)).hide();
    }
    }
    
    truncateHTML(description: string, limit: number = 100): string {
        if (!description) return '';
        return description.length > limit ? description.substring(0, limit) + '...' : description;
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