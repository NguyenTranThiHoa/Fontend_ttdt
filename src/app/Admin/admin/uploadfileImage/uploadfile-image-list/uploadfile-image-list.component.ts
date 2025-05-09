import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { UploadfileImageService } from '../uploadImage.service';
import { Folder } from '../folder.model';
import { PostImage } from '../postImage.model';

@Component({
    selector: 'app-uploadfile-image-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule,NgxPaginationModule ],
    templateUrl: './uploadfile-image-list.component.html',
    styleUrls: ['./uploadfile-image-list.component.css']
})
export class UploadfileImageListComponent implements OnInit {
    activeFolderId: number | null = null; // Thêm thuộc tính này

    isEditMode: boolean = false; 
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

    
    // selectedFile: string = '';
    successMessage: string = '';
    errorMessage: string = '';

    searchQuery: string = '';
    imagePreview: string | null = null;
    imagePreview1: string | null = null;

    constructor(
        private uploadService: UploadfileImageService,
        private cdr: ChangeDetectorRef,
        private router: Router,
    ) { }

    ngOnInit(): void {
        this.loadFolder();
        this.loadPostImage();

        this.apiDomains = [
            'https://api.ttdt2503.id.vn',
            'https://api.ttdt03.id.vn',
            'https://api.congtt123.id.vn',
        ]
    }

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

    getCategoryFullName(image: PostImage): string {
        let categoryNames: string[] = [];
        this.findCategoryHierarchy(this.folder, image.id_folder, categoryNames);
        return categoryNames.join(' > ') || 'Không xác định';
    }

    private findCategoryHierarchy(folder: Folder[], id: number | null, categoryNames: string[]): boolean {
        if (id === null) return false;

        for (const category of folder) {
        if (category.id_folder === id) {
            categoryNames.unshift(category.name_folder);
            return true;
        }
        if (category.children && category.children.length > 0) {
            const found = this.findCategoryHierarchy(category.children, id, categoryNames);
            if (found) {
            categoryNames.unshift(category.name_folder);
            return true;
            }
        }
        }
        return false;
    }

    createFolder(): void {
        const newFolder: Folder = {
            id_folder: 0,
            name_folder: this.newFolderName,
            parentId: null,
            children: [],
            createdAt: new Date().toISOString()
        };

        this.uploadService.CreateFolder(newFolder).subscribe({
            next: (folder) => {
                this.folder.push(folder);
                this.newFolderName = '';
                this.hideModal(this.getModalInstance('createFolderModal'));
                this.loadFolder();
                this.loadPostImage();
            },
            error: (err) => console.error('Lỗi khi tạo thư mục:', err)
        });
    }

    renameFolder(): void {
        if (this.selectedFolder) {
            const updatedFolder: Folder = {
                ...this.selectedFolder,
                name_folder: this.renameFolderName
            };

            this.uploadService.UpdateFolder(this.selectedFolder.id_folder, updatedFolder).subscribe({
                next: (folder) => {
                    const index = this.folder.findIndex(f => f.id_folder === folder.id_folder);
                    if (index !== -1) {
                        this.folder[index] = folder;
                    }
                    this.renameFolderName = '';
                    this.hideModal(this.getModalInstance('renameFolderModal'));
                    this.loadFolder();
                    this.loadPostImage();
                },
                error: (err) => console.error('Lỗi khi đổi tên thư mục:', err)
            });
        }
    }

    deleteFolder(): void {
        if (this.selectedFolder) {
            this.uploadService.DeleteFolder(this.selectedFolder.id_folder).subscribe({
                next: () => {
                    this.folder = this.folder.filter(f => f.id_folder !== this.selectedFolder?.id_folder);
                    this.selectedFolder = null;
                    this.hideModal(this.getModalInstance('deleteFolderModal'));
                    this.loadFolder();
                    this.loadPostImage();
                },
                error: (err) => console.error('Lỗi khi xóa thư mục:', err)
            });
        }
    }

    // Mở modal tạo thư mục
    openCreateModal(): void {
        this.isEditMode = false; // Chế độ thêm mới
        this.resetForm1();
        this.showModal('folderModal');
    }

    resetForm1(): void {
        // Reset lại giá trị cho form
        this.folderForm = {
            id_folder: 0,
            name_folder: '',
            parentId: null,
            children: [],
            createdAt: new Date().toISOString(),
            isExpanded: true,
        };
    }

    openEditModal(): void {
        if (this.selectedFolder) {
            this.isEditMode = true; // Chế độ chỉnh sửa
            this.folderForm = { ...this.selectedFolder }; // Gán dữ liệu thư mục được chọn vào form
            this.showModal('folderModal');
        } else {
            this.showErrorMessage("Vui lòng chọn một thư mục để chỉnh sửa.");
        }
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
                                // Chắc chắn rằng nếu không có thư mục cha, parentId là null
            if (!this.folderForm.parentId) {
                this.folderForm.parentId = null;  // Đảm bảo gửi null khi không có parentId
            }
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

    // Hiển thị modal
    showModal(modalId: string): void {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        }
    }

    // Ẩn modal
    hideModal(modal: bootstrap.Modal | null): void {
        if (modal) {
            modal.hide();
        }
    }

    getModalInstance(modalId: string): bootstrap.Modal | null {
        const modalElement = document.getElementById(modalId);
        return modalElement ? bootstrap.Modal.getInstance(modalElement) : null;
    }

    // Hiển thị thông báo thành công
    showSuccessMessage(message: string): void {
        this.successMessage = message;
        setTimeout(() => {
            this.successMessage = '';
        }, 3000);
    }

    // Hiển thị thông báo lỗi
    showErrorMessage(message: string): void {
        this.errorMessage = message;
        setTimeout(() => {
            this.errorMessage = '';
        }, 3000);
    }

    selectedImageId: number | null = null; // ID của ảnh được chọn để di chuyển
    selectedTargetFolderId: number | null = null; // ID của thư mục đích

    // Mở modal di chuyển ảnh
    openMoveImageModal(imageId: number): void {
        this.selectedImageId = imageId;
        this.selectedTargetFolderId = null; 
        this.showModal('moveImageModal');
    }

    moveImage(imageId: number | null, targetFolderId: number | null): void {
        if (imageId === null || targetFolderId === null) {
            this.showErrorMessage("Vui lòng chọn ảnh và thư mục đích.");
            return;
        }

        this.uploadService.MoveImage(imageId, targetFolderId).subscribe({
            next: (image) => {
                this.showSuccessMessage("Di chuyển ảnh thành công!");
                this.loadPostImage(); // Tải lại danh sách ảnh
                this.hideModal(this.getModalInstance('moveImageModal')); // Đóng modal
            },
            error: (err) => {
                this.showErrorMessage("Lỗi khi di chuyển ảnh: " + err.message);
            }
        });
    }

    // Mở modal xóa hình ảnh
    openDeleteImageModal(imageId: number): void {
        this.selectedImageId = imageId;
        this.showModal('deleteImageModal');
    }

    // Xử lý xóa hình ảnh
    deleteImage(imageId: number | null): void {
        if (imageId === null) {
            this.showErrorMessage("Không tìm thấy hình ảnh để xóa.");
            return;
        }

        this.uploadService.DeletePostImage(imageId).subscribe({
            next: () => {
                this.showSuccessMessage("Xóa hình ảnh thành công!");
                this.loadPostImage(); // Tải lại danh sách ảnh
            },
            error: (err) => {
                this.showErrorMessage("Lỗi khi xóa hình ảnh: " + err.message);
            }
        });
    }

    // Mở modal sửa hình ảnh
    // openEditImageModal(image: PostImage): void {
    //     this.selectedImageId = image.id_Image;
    //     this.imageForm = { ...image }; // Gán dữ liệu hình ảnh được chọn vào form
    //     this.imagePreview = image.filePath ? `https://ttdt2503.id.vn/api/images/${image.filePath}` : null;
    //     this.showModal('editImageModal');
    // }

    openEditImageModal(image: PostImage): void {
        this.selectedImageId = image.id_Image;
        this.imageForm = { ...image };
        
        // Preview fallback theo domain
        this.imagePreview1 = this.getImageUrl(this.imageForm);

        this.showModal('editImageModal');
    }


    // Xử lý khi chọn ảnh mới
    onImageSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.imageForm.filePath = file.name; // Lưu tên file
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    // Xử lý cập nhật hình ảnh
    updateImage(imageId: number | null, imageForm: PostImage): void {
        if (imageId === null) {
            this.showErrorMessage("Không tìm thấy hình ảnh để cập nhật.");
            return;
        }

        this.uploadService.UpdatePostImage(imageId, imageForm).subscribe({
            next: (image) => {
                this.showSuccessMessage("Cập nhật hình ảnh thành công!");
                this.loadPostImage(); // Tải lại danh sách ảnh
                this.hideModal(this.getModalInstance('editImageModal')); // Đóng modal
            },
            error: (err) => {
                this.showErrorMessage("Lỗi khi cập nhật hình ảnh: " + err.message);
            }
        });
    }

    // Phương thức encodeURIComponent
    encodeURI(url: string): string {
        return encodeURI(url);
    }

    page: number = 1;
    pageSize: number = 10;
    
    get totalPages(): number {
        return Math.ceil(this.filteredPostImage.length / this.pageSize);
    }

    // getPaginationArray(): number[] {
    //     return Array(this.totalPages).fill(0).map((_, i) => i + 1);
    // }

    getPaginationArray(): (number | string)[] {
        const total = this.totalPages;
        const current = this.page;
        const delta = 2; // Số trang trước/sau trang hiện tại

        const range: (number | string)[] = [];
        const rangeWithDots: (number | string)[] = [];

        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            range.push(i);
            }
        }

        let last: number | null = null;
        for (let i of range) {
            if (last && typeof i === 'number' && i - last > 1) {
            rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            last = typeof i === 'number' ? i : last;
        }

        return rangeWithDots;
    }

    onPageClick(p: number | string): void {
        if (typeof p === 'number') {
            this.page = p;
        }
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

    // Reset form sau khi upload thành công
    resetForm(): void {
        this.selectedFile = null;
        this.selectedFolderId = null;
        this.imagePreview = null;

        // Reset giá trị input file
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
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

    getSafeImagePath(imagePath: string): string {
        return imagePath.replace(/\\/g, "/"); // Đảm bảo đúng định dạng URL
    }

    apiDomains: string[] = [];

    getImageUrl(image: any): string {
        if (!this.apiDomains || this.apiDomains.length === 0) {
            console.warn("⚠️ apiDomains chưa được khởi tạo hoặc rỗng.");
            return '';
        }
        
        if (image.domainIndex === undefined || image.domainIndex === null) {
            image.domainIndex = 0;
        }
        
        const domain = this.apiDomains[image.domainIndex] || this.apiDomains[0];
        const filePath = this.getSafeImagePath(image.filePath || '');
        
        return `${domain}/api/images/${filePath}`;
    }
    
    handleImageError(event: Event, image: any) {
        if (!this.apiDomains || this.apiDomains.length === 0) {
            console.warn("⚠️ apiDomains chưa được khởi tạo hoặc rỗng.");
            return;
        }
        
        if (image.domainIndex === undefined || image.domainIndex === null) {
            image.domainIndex = 0;
        }
        
        image.domainIndex++;
        
        if (image.domainIndex < this.apiDomains.length) {
            const imgElement = event.target as HTMLImageElement;
            imgElement.src = this.getImageUrl(image);
        } else {
            console.warn('❌ Không còn domain nào khả dụng cho ảnh:', image.filePath);
        }
    }

}