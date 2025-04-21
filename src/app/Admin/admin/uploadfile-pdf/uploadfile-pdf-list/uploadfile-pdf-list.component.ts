import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { FolderPdf } from '../folder-pdf.model';
import { PostPdf } from '../postPdf.model';
import { UploadPdfService } from '../uploadPdf.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-uploadfile-pdf-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],
  templateUrl: './uploadfile-pdf-list.component.html',
  styleUrl: './uploadfile-pdf-list.component.css'
})
export class UploadfilePdfListComponent implements OnInit {
    activeFolderId: number | null = null; // Thêm thuộc tính này

    isEditMode: boolean = false; 
    selectedFolder: FolderPdf | null = null;
    newFolderName: string = '';
    renameFolderName: string = '';

    private _filteredPostPdf: PostPdf[] = [];

    // Phương thức để mở rộng/thu gọn thư mục
    toggleFolder(folderPdf: FolderPdf): void {
        folderPdf.isExpanded = !folderPdf.isExpanded; // Đảo trạng thái mở rộng/thu gọn
    }

    selectFolder(folderPdf: FolderPdf): void {
        this.activeFolderId = folderPdf.id_folder_pdf; // Cập nhật ID thư mục đang được chọn
        this.selectedFolder = folderPdf; // Cập nhật thư mục được chọn
        this._filteredPostPdf = this.pdf.filter(pdf => pdf.id_folder_pdf === folderPdf.id_folder_pdf); // Lọc hình ảnh theo thư mục
        console.log('Thư mục được chọn:', folderPdf); // Debug dữ liệu
        console.log('Pdf được lọc:', this._filteredPostPdf); // Debug dữ liệu
    }

    folderPdf: FolderPdf[] = [];
    folderPdfForm: FolderPdf = {
        id_folder_pdf: 0,
        name_folder: '',
        parentId: null,
        children: [],
        createdAt: ''
    };

    pdf: PostPdf[] = [];
    pdfForm: PostPdf = {
        id_pdf: 0,
        fileName: '',           
        filePath: '',
        id_folder_pdf: 0,         
        uploadedAt: ''    
    }
    
    successMessage: string = '';
    errorMessage: string = '';

    searchQuery: string = '';
    imagePreview: string | null = null;

    constructor(
        private uploadPdfService: UploadPdfService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        public sanitizer: DomSanitizer,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.loadFolderPdf();
        this.loadPostPdf();
    }

    loadFolderPdf(): void {
        this.uploadPdfService.GetFolderPdf().subscribe({
            next: (categories) => {
                this.folderPdf = categories.map(category => ({ ...category }));
                console.log('Danh sách thư mục:', this.folderPdf); // Debug dữ liệu
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Lỗi khi tải danh sách thư mục:', err)
        });
    }

    loadPostPdf(): void {
        this.uploadPdfService.GetPdf().subscribe(pdf => {
            this.pdf = pdf.map(ne => ({ ...ne, selected: false }));
            this._filteredPostPdf = [...this.pdf]; // Khởi tạo danh sách đã lọc
            console.log('Danh sách hình ảnh:', this.pdf); // Debug dữ liệu
            this.cdr.detectChanges();
        });
    }

    getCategoryFullName(pdf: PostPdf): string {
        let categoryNames: string[] = [];
        this.findCategoryHierarchy(this.folderPdf, pdf.id_folder_pdf, categoryNames);
        return categoryNames.join(' > ') || 'Không xác định';
    }

    private findCategoryHierarchy(folderPdf: FolderPdf[], id: number | null, categoryNames: string[]): boolean {
        if (id === null) return false;

        for (const category of folderPdf) {
        if (category.id_folder_pdf === id) {
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

    createFolderPdf(): void {
        const newFolderPdf: FolderPdf = {
            id_folder_pdf: 0,
            name_folder: this.newFolderName,
            parentId: null,
            children: [],
            createdAt: new Date().toISOString()
        };

        this.uploadPdfService.CreateFolderPdf(newFolderPdf).subscribe({
            next: (folder) => {
                this.folderPdf.push(folder);
                this.newFolderName = '';
                this.hideModal(this.getModalInstance('createFolderModalPdf'));
                this.loadFolderPdf();
                this.showSuccessMessage("Tạo thư mục thành công!");
                this.loadPostPdf();
            },
            error: (err) => {
                console.error('Lỗi khi tạo thư mục:', err);
                this.showErrorMessage("Lỗi khi tạo thư mục: " + err.message);
            }
        });
    }

    renameFolderPdf(): void {
        if (this.selectedFolder) {
        const updatedFolder: FolderPdf = {
            ...this.selectedFolder,
            name_folder: this.renameFolderName
        };

        this.uploadPdfService.UpdateFolderPdf(this.selectedFolder.id_folder_pdf, updatedFolder).subscribe({
            next: (folder) => {
                const index = this.folderPdf.findIndex(f => f.id_folder_pdf === folder.id_folder_pdf);
                if (index !== -1) {
                    this.folderPdf[index] = folder;
                }
                this.renameFolderName = '';
                this.hideModal(this.getModalInstance('renameFolderModalPdf'));
                this.loadFolderPdf();
                this.showSuccessMessage("Đổi tên thư mục thành công!");
                this.loadPostPdf();
            },
            error: (err) => {
                console.error('Lỗi khi đổi tên thư mục:', err);
                this.showErrorMessage("Lỗi khi đổi tên thư mục: " + err.message);
            }
        });
        }
    }

    deleteFolderPdf(): void {
        if (this.selectedFolder) {
        this.uploadPdfService.DeleteFolderPdf(this.selectedFolder.id_folder_pdf).subscribe({
            next: () => {
                this.folderPdf = this.folderPdf.filter(f => f.id_folder_pdf !== this.selectedFolder?.id_folder_pdf);
                this.selectedFolder = null;
                this.hideModal(this.getModalInstance('deleteFolderModalPdf'));
                this.loadFolderPdf();
                this.showSuccessMessage("Xóa thư mục thành công!");
                this.loadPostPdf();
            },
            error: (err) => {
                console.error('Lỗi khi xóa thư mục:', err);
                this.showErrorMessage("Lỗi khi xóa thư mục: " + err.message);
            }
        });
        }
    }

    // Mở modal tạo thư mục
    openCreateModaPdfl(): void {
        this.isEditMode = false; // Chế độ thêm mới
        this.resetForm1();
        this.showModal('folderModalpdf');
    }
 
    resetForm1(): void {
        // Reset lại giá trị cho form
        this.folderPdfForm = {
            id_folder_pdf: 0,
            name_folder: '',
            parentId: null,
            children: [],
            createdAt: new Date().toISOString(),
            isExpanded: true,
        };
    }

    openEditModalPdf(): void {
        if (this.selectedFolder) {
            this.isEditMode = true; // Chế độ chỉnh sửa
            this.folderPdfForm = { ...this.selectedFolder }; // Gán dữ liệu thư mục được chọn vào form
            this.showModal('folderModalpdf');
        } else {
            this.showErrorMessage("Vui lòng chọn một thư mục để chỉnh sửa.");
        }
    }

    // Lưu thư mục (thêm mới hoặc cập nhật)
    saveFolderPdf(): void {
        if (this.isEditMode) {
        this.uploadPdfService.UpdateFolderPdf(this.folderPdfForm.id_folder_pdf, this.folderPdfForm).subscribe({
            next: () => {
                this.loadFolderPdf(); // Tải lại danh sách thư mục
                this.showSuccessMessage("Cập nhật thư mục thành công!");
                this.hideModal(this.getModalInstance('folderModalPdf'));
            },
            error: (err) => {
                console.error('Lỗi khi cập nhật:', err);
                this.showErrorMessage("Lỗi khi cập nhật thư mục: " + err.message);
            }
        });
        } else {
                    // Chắc chắn rằng nếu không có thư mục cha, parentId là null
        if (!this.folderPdfForm.parentId) {
            this.folderPdfForm.parentId = null;  // Đảm bảo gửi null khi không có parentId
        }
        
        console.log(this.folderPdfForm);  // Kiểm tra giá trị trước khi gửi
            
        this.uploadPdfService.CreateFolderPdf(this.folderPdfForm).subscribe({
            next: (newFolder) => {
                this.loadFolderPdf(); // Tải lại danh sách thư mục
                this.showSuccessMessage("Thêm thư mục thành công!");
                this.hideModal(this.getModalInstance('folderModalPdf'));
            },
            error: (err) => {
                console.error('Lỗi khi thêm:', err);
                this.showErrorMessage("Lỗi khi thêm thư mục: " + (err.error?.message || err.message));
            }
        });
        }
    }

    // Phương thức để hiển thị tên thư mục đầy đủ (bao gồm cả phân cấp)
    getFolderFullName(folderPdf: FolderPdf, level: number): string {
        let prefix = '—'.repeat(level * 3);
        return `${prefix} ${folderPdf.name_folder}`;
    }

    get filteredPostPdf(): PostPdf[] {
        return this._filteredPostPdf;
    }

    get filteredFolderPdf(): FolderPdf[] {
        if (!this.searchQuery) return this.folderPdf;
        return this.filterFolderPdf(this.folderPdf, this.searchQuery.toLowerCase());
    }

    private filterFolderPdf(folderPdf: FolderPdf[], query: string): FolderPdf[] {
        return folderPdf
            .map(category => {
                const matches = category.name_folder.toLowerCase().includes(query);
                const filteredChildren = category.children && category.children.length > 0
                    ? this.filterFolderPdf(category.children, query)
                    : [];
                if (matches || filteredChildren.length > 0) {
                    return { ...category, children: filteredChildren };
                }
                return null;
            })
            .filter(category => category !== null) as FolderPdf[];
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

    /***************************************************************************************************************/
    selectedImageId: number | null = null; // ID của pdf được chọn để di chuyển
    selectedTargetFolderId: number | null = null; // ID của thư mục đích

    // Mở modal di chuyển pdf
    openMovePdfModal(pdfId: number): void {
        this.selectedImageId = pdfId;
        this.selectedTargetFolderId = null; // Reset giá trị khi mở modal
        this.showModal('movePdfModal');
    }

    movePdf(pdfId: number | null, targetFolderId: number | null): void {
        if (pdfId === null || targetFolderId === null) {
            this.showErrorMessage("Vui lòng chọn pdf và thư mục đích.");
            return;
        }

        this.uploadPdfService.MovePdf(pdfId, targetFolderId).subscribe({
            next: (image) => {
                this.showSuccessMessage("Di chuyển pdf thành công!");
                this.loadPostPdf(); // Tải lại danh sách pdf
                this.hideModal(this.getModalInstance('movePdfModal')); // Đóng modal
            },
            error: (err) => {
                this.showErrorMessage("Lỗi khi di chuyển pdf: " + err.message);
            }
        });
    }

    // Mở modal xóa Pdf
    openDeletePdfModal(pdfId: number): void {
        this.selectedImageId = pdfId;
        this.showModal('deletePdfModal');
    }

    // Xử lý xóa pdfs
    deletePdf(pdfId: number | null): void {
        if (pdfId === null) {
            this.showErrorMessage("Không tìm thấy pdf để xóa.");
            return;
        }

        this.uploadPdfService.DeletePostPdf(pdfId).subscribe({
            next: () => {
                this.showSuccessMessage("Xóa hình pdf thành công!");
                this.loadPostPdf(); 
            },
            error: (err) => {
                this.showErrorMessage("Lỗi khi xóa pdf: " + err.message);
            }
        });
    }

    // Mở modal sửa pdf
    openEditPdfModal(pdf: PostPdf): void {
        this.selectedImageId = pdf.id_pdf;
        this.pdfForm = { ...pdf }; 
        this.imagePreview = pdf.filePath ? `https://api.ttdt2503.id.vn/api/pdf/${pdf.filePath}` : null;
        this.showModal('editPdfModal');
    }
    
    // Xử lý cập nhật pdf
    updatePdf(pdfId: number | null, pdfForm: PostPdf): void {
        if (pdfId === null) {
            this.showErrorMessage("Không tìm thấy pdf để cập nhật.");
            return;
        }

        this.uploadPdfService.UpdatePostPdf(pdfId, pdfForm).subscribe({
            next: (image) => {
                this.showSuccessMessage("Cập nhật pdf thành công!");
                this.loadPostPdf(); 
                this.hideModal(this.getModalInstance('editPdfModal')); 
            },
            error: (err) => {
                this.showErrorMessage("Lỗi khi cập nhật pdf: " + err.message);
            }
        });
    }

    // Phương thức encodeURIComponent
    encodeURI(url: string): string {
        return encodeURI(url);
    }

    selectedFolderId: number | null = null; // ID thư mục được chọn
    selectedFile: File | null = null; // File pdf được chọn

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

    page: number = 1;
    pageSize: number = 10;

    get totalPages(): number {
        return Math.ceil(this.filteredPostPdf.length / this.pageSize);
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

    // Xử lý upload pdf
    uploadPdf(): void {
        // Kiểm tra nếu không có file được chọn
        if (!this.selectedFile) {
            this.showSuccessMessage("Vui lòng chọn một tệp pdf!");
            return;
        }

        // Kiểm tra nếu không có thư mục được chọn
        if (!this.selectedFolderId) {
            this.showSuccessMessage("Vui lòng chọn thư mục!");
            return;
        }

        // Gọi API upload pdf
        this.uploadPdfService.uploadPdf(this.selectedFile, this.selectedFolderId).subscribe({
            next: (pdf) => {
                this.showSuccessMessage("Upload pdf thành công!");
                this.resetForm(); // Reset lại form sau khi upload thành công
                this.loadFolderPdf(); // Tải lại danh sách thư mục PDF
                this.loadPostPdf(); // Tải lại danh sách PDF
            },
            error: (err) => {
                console.error('Lỗi khi upload pdf:', err);
                this.showErrorMessage("Lỗi khi upload pdf: " + err.message);
            }
        });
    }

    // Xử lý sự kiện khi file PDF được chọn
    onPdfSelected(event: any) {
        const file: File = event.target.files[0];

        if (!file) {
            this.errorMessage = "Vui lòng chọn một file PDF.";
            return;
        }

        // Kiểm tra định dạng file
        const fileType = file.type;
        const validTypes = ["application/pdf"];

        if (!validTypes.includes(fileType)) {
            this.errorMessage = "Chỉ được phép tải lên file PDF.";
            event.target.value = ''; // Reset input file
        } else {
            this.errorMessage = ''; // Xóa lỗi nếu chọn đúng PDF
            this.selectedFile = file; // Gán file được chọn vào selectedFile
        }
    }

    /**************************Domain**************************/
    // Danh sách các domain
    apiDomains: string[] = [
        'https://api.ttdt2503.id.vn',
        'https://api.ttdt03.id.vn',
        'https://api.congtt123.id.vn'
    ];
    
    selectedPdf: PostPdf | null = null;
    currentDomainIndex: number = 0;
    safePdfUrl: SafeResourceUrl | null = null;
    currentDomain: string = '';
    loading: boolean = false; // Khai báo biến loading

    getSafeFilePath(path: string): string {
        return path?.replace(/\\/g, "/");
    }

    openViewPdfModal(pdf: PostPdf): void {
        this.selectedPdf = pdf;
        this.currentDomainIndex = 0; // Bắt đầu từ domain chính
        this.loading = true; // Bắt đầu tải
        this.tryLoadPdfFromNextDomain();
        this.showModal('viewPdfModal');
    }

    getPdfUrl(pdf: PostPdf): string {
        if (!this.apiDomains.length) {
            console.warn("⚠️ apiDomains chưa được khởi tạo hoặc rỗng.");
            return '';
        }

        const filePath = this.getSafeFilePath(pdf.filePath || '');
        const domain = this.apiDomains[this.currentDomainIndex];
        return `${domain}/api/pdf/${filePath}`;
    }

    tryLoadPdfFromNextDomain(): void {
        if (!this.selectedPdf) {
            this.safePdfUrl = null;
            this.loading = false; // Kết thúc tải
            this.showErrorMessage("Không có tài liệu được chọn.");
            return;
        }

        const url = this.getPdfUrl(this.selectedPdf);
        this.http.head(url, { observe: 'response' }).subscribe({
            next: (response) => {
                if (response.status === 200) {
                    this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                    this.currentDomain = this.apiDomains[this.currentDomainIndex]; // Cập nhật domain hiện tại
                } else {
                    this.loadNextDomain();
                }
                this.loading = false; // Kết thúc tải
            },
            error: () => {
                console.log(`Không thể tải PDF từ ${url}`);
                this.loadNextDomain();
            },
        });
    }

    loadNextDomain(): void {
        this.currentDomainIndex++;
        if (this.currentDomainIndex < this.apiDomains.length) {
            this.tryLoadPdfFromNextDomain();
        } else {
            this.safePdfUrl = null;
            this.loading = false; // Kết thúc tải
            this.showErrorMessage("Không thể tải file PDF từ bất kỳ domain nào.");
        }
    }

    handlePdfError(event: Event, pdf: PostPdf): void {
        this.currentDomainIndex++;
        if (this.currentDomainIndex < this.apiDomains.length) {
            this.loadPdfFromCurrentDomain(pdf, event);
        } else {
            this.safePdfUrl = null;
            this.showErrorMessage("Không thể tải file PDF từ bất kỳ domain nào.");
        }
    }

    loadPdfFromCurrentDomain(pdf: PostPdf, event: Event): void {
        const iframeElement = event.target as HTMLIFrameElement;
        const newUrl = this.getPdfUrl(pdf);
        iframeElement.src = newUrl;
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(newUrl);
        this.currentDomain = this.apiDomains[this.currentDomainIndex];
    }

    handleIframeError(): void {
        this.handlePdfError(new Event('iframeError'), this.selectedPdf!);
    }

}