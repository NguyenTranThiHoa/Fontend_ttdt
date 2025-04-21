import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';  
import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Import HttpClient

import { Documents } from '../documents.model';
import { DocumentsService } from '../documents.service';
import { Category_documents } from '../../categories-documents/categories-documents.model';
import { AccountsService } from '../../accounts/accounts.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx'; // Thêm thư viện để xuất Excel

import { CategoriesDocumentsService } from '../../categories-documents/categories-documents.service';
import { Accounts } from '../../../../Auth/Accounts.model';
import { FolderPdf } from '../../uploadfile-pdf/folder-pdf.model';
import { PostPdf } from '../../uploadfile-pdf/postPdf.model';
import { UploadPdfService } from '../../uploadfile-pdf/uploadPdf.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule],  // Thêm CommonModule vào imports
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit {
  category_documents: Category_documents[] = [];
  documents: Documents[] = [];
  accounts: Accounts[] = [];

  documentsForm: Documents = {
    id_document: 0,
    title: '',
    id_category_document: 0,
    file_path: '',
    description_short: '',
    description: '',
    create_at: '',
    id_account: 0,
    view_documents: 0,
    selected: false,
    isVisible: true,
  };

  isEditMode = false;
  successMessage = '';
  page: number = 1;
  pageSize: number = 10;
  selectedCategoryId: number | null = null;
  isAllSelected: boolean = false;
  selectedDocumentsId: number | null = null;
  searchQuery: string = '';

  username: string | null = null;
  role: string | null = null;
  id_account: number | null = null;

  constructor(
    private documentsService: DocumentsService,
    private cdr: ChangeDetectorRef,
    private httpClient: HttpClient,
    private categoriesDocumentsService: CategoriesDocumentsService,
    private accountsService: AccountsService,
    private sanitizer: DomSanitizer,
    private uploadPdfService: UploadPdfService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadAccounts();
    this.loadCategory_documents();

    this.loadFolderPdf();
    this.loadPostPdf();

    this.loadUserInfo();
  }

  loadUserInfo() {
    this.username = localStorage.getItem('username') || 'Người dùng';
    this.role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    // Kiểm tra nếu LocalStorage có lưu ID không
    let storedId = localStorage.getItem('id_account');
    if (storedId) {
      this.id_account = Number(storedId);
    } else {
      // Nếu không có ID, tìm ID theo username từ danh sách tài khoản
      this.accountsService.GetAccounts().subscribe((data) => {
        this.accounts = data;
        const user = this.accounts.find(account => account.username === this.username);
        this.id_account = user ? user.id_account : null;

        // Lưu lại vào LocalStorage để lần sau không cần tìm lại
        if (this.id_account !== null) {
          localStorage.setItem('id_account', this.id_account.toString());
        }

        console.log("Tìm thấy ID:", this.id_account);
      });
    }
  }

  reloadPage(): void {
    window.location.reload();
  }

  loadDocuments(): void {
    this.documentsService.GetDocuments().subscribe(documents => {
      this.documents = documents;
    });
  }

  loadAccounts(): void {
    this.accountsService.GetAccounts().subscribe((data) => {
      console.log(data);
      this.accounts = data;
    });
  }

  loadCategory_documents(): void {
    this.categoriesDocumentsService.GetCategory_documents().subscribe(categories => {
      this.category_documents = categories;
    });
  }

  private getAllChildCategoryIds(categoryId: number, categories: Category_documents[], result: number[] = []): number[] {
    const findCategory = (cats: Category_documents[]): Category_documents | undefined => {
      for (const cat of cats) {
        if (cat.id_category_document === categoryId) {
          return cat;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const category = findCategory(categories);
    if (category) {
      result.push(category.id_category_document);
      if (category.children && category.children.length > 0) {
        category.children.forEach(child => {
          this.getAllChildCategoryIds(child.id_category_document, category.children, result);
        });
      }
    }
    return result;
  }
  
  get filteredDocuments(): Documents[] {
    let filtered = [...this.documents];

    // Lọc theo danh mục
    if (this.selectedCategoryId !== null) {
      const allCategoryIds = this.getAllChildCategoryIds(this.selectedCategoryId, this.category_documents);
      filtered = filtered.filter(documents =>
        documents.id_category_document !== null &&
        allCategoryIds.includes(documents.id_category_document)
      );
    }

    // Lọc theo tìm kiếm
    if (this.searchQuery) {
      filtered = filtered.filter(documents =>
        (documents.title?.toLowerCase() || '').includes(this.searchQuery.toLowerCase())
      );
    }

    return filtered;
  }
  
  // Khi thay đổi danh mục
  filterByCategory(): void {
    console.log('Trước khi lọc - selectedCategoryId:', this.selectedCategoryId); // Debug trước khi lọc
    this.page = 1;
    this.cdr.detectChanges();
    console.log('Sau khi lọc - filteredNews_Events:', this.filteredDocuments); // Debug sau khi lọc
  }

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategoryId = value === "null" ? null : Number(value);
    console.log('Dropdown thay đổi, selectedCategoryId:', this.selectedCategoryId);
    this.filterByCategory();
  }

  getCategoryFullName(documentss: Documents): string {
    let categoryNames: string[] = [];
    if (documentss.id_category_document) {
      this.findCategoryHierarchy(this.category_documents, documentss.id_category_document, categoryNames);
    }
    return categoryNames.join(' > ') || 'Không xác định';
  }


  private findCategoryHierarchy(categories: Category_documents[], id: number | null, categoryNames: string[]): boolean {
    if (id === null) return false;

    for (const category of categories) {
      if (category.id_category_document === id) {
        categoryNames.unshift(category.name_category_document);
        return true;
      }
      if (category.children && category.children.length > 0) {
        const found = this.findCategoryHierarchy(category.children, id, categoryNames);
        if (found) {
          categoryNames.unshift(category.name_category_document);
          return true;
        }
      }
    }
    return false;
  }

  getAccounts_Name(id_account: number): string {
    const cde = this.accounts.find((loc) => loc.id_account === id_account);
    return cde ? cde.username : 'Không xác định';
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showModal('categoryModal');
  }
  
  openEditModal(documents: Documents): void {
    this.isEditMode = true;
    this.documentsForm = { ...documents };
    this.showModal('categoryModal');
  }

  errorMessage: string = '';

  selectedFolder: FolderPdf | null = null;

  private _filteredPostPdf: PostPdf[] = [];
  activeFolderId: number | null = null; // Thêm thuộc tính này
  
  // Phương thức để mở rộng/thu gọn thư mục
  toggleFolder(folderPdf: FolderPdf): void {
    folderPdf.isExpanded = !folderPdf.isExpanded; // Đảo trạng thái mở rộng/thu gọn
  }

  selectFolder(folderPdf: FolderPdf): void {
    this.activeFolderId = folderPdf.id_folder_pdf; // Cập nhật ID thư mục đang được chọn
    this.selectedFolder = folderPdf; // Cập nhật thư mục được chọn
    this._filteredPostPdf = this.pdf.filter(pdf => pdf.id_folder_pdf === folderPdf.id_folder_pdf); // Lọc pdf theo thư mục
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

  openPdfSelectorModal() {
    const modalElement = document.getElementById('pdfSelectorModal');
    if (modalElement) {
      const modalInstance = new bootstrap.Modal(modalElement);
      modalInstance.show();
    } else {
      console.error("Không tìm thấy modal với ID 'pdfSelectorModal'");
    }
  }

  selectedPdfName: string = "";

  selectPdf(filePath: string, fileName: string) {
    // Lưu đường dẫn file vào form
    this.documentsForm.file_path = filePath;

    // Hiển thị tên file trong input
    this.selectedPdfName = fileName;

    // Ẩn modal sau khi chọn file PDF
    const modalElement = document.getElementById('pdfSelectorModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  validateDocumentForm(): boolean {
    this.errorMessage = ''; // Reset lỗi trước khi kiểm tra

    const rawTitle = this.documentsForm.title;
    const title = rawTitle?.trim();
    const categoryId = this.documentsForm.id_category_document;
    const description = this.documentsForm.description?.trim();
    const description_short = this.documentsForm.description_short?.trim();
    const pdfFile = this.selectedPdfName;

    // Kiểm tra Tiêu đề Văn bản
    if (!title) {
      this.errorMessage = "Tên văn bản - pháp luật không được để trống!";
      return false;
    }

    // Kiểm tra khoảng trắng ở đầu/cuối
    if (rawTitle !== title) {
      this.errorMessage = "Tên văn bản không được có khoảng trắng ở đầu hoặc cuối!";
      return false;
    }

    // Regex cho phép: chữ cái có dấu, chữ số, khoảng trắng và , . / -
    const regex = /^[\p{L}0-9\s,./-]+$/u;
    if (!regex.test(title)) {
      this.errorMessage = "Tên văn bản chỉ được chứa chữ cái (có dấu), số, khoảng trắng và các dấu , . / -";
      return false;
    }

    // Kiểm tra tài khoản
    if (!this.documentsForm.id_account || this.documentsForm.id_account === 0) {
      this.errorMessage = "Vui lòng chọn tài khoản!";
      return false;
    }

    // Kiểm tra Danh mục
    if (!categoryId) {
      this.errorMessage = "Vui lòng chọn danh mục!";
      return false;
    }

    // Kiểm tra Nội dung Chính
    if (!description) {
      this.errorMessage = "Nội dung chính không được để trống!";
      return false;
    }

    // Kiểm tra Nội dung Tiêu đề Ngắn
    if (!description_short) {
      this.errorMessage = "Mô tả ngắn không được để trống!";
      return false;
    }

    // Kiểm tra PDF
    if (!pdfFile) {
      this.errorMessage = "Vui lòng chọn pdf!";
      return false;
    }

    return true;
  }


  saveDocuments(): void {

    if (!this.validateDocumentForm()) {
      return;
    }
    console.log("Dữ liệu gửi lên API:", this.documentsForm);
    
    if (this.fileToUpload) {
      this.documentsService.UploadPdfDocument(this.fileToUpload).subscribe((response) => {
        this.documentsForm.file_path = response.filePath;
            
        if (this.isEditMode) {
          this.documentsService.UpdateDocuments(this.documentsForm.id_document, this.documentsForm).subscribe(() => {
            this.loadDocuments();
            this.showSuccessMessage("Cập nhật thành công!");
            this.hideModal(this.getModalInstance('categoryModal'));
          });
        } else {
          this.documentsService.CreateDocuments(this.documentsForm).subscribe((documents) => {
            this.documents.push({ ...documents, selected: false });
            this.showSuccessMessage("Thêm thành công!");
            this.hideModal(this.getModalInstance('categoryModal'));
          });
        }
      }, (error) => {
        console.error("Lỗi khi upload file:", error);
        this.showSuccessMessage("Có lỗi xảy ra khi upload file.");
      });
    } else {
      if (this.isEditMode) {
        this.documentsService.UpdateDocuments(this.documentsForm.id_document, this.documentsForm).subscribe(() => {
          this.loadDocuments();
          this.showSuccessMessage("Cập nhật thành công!");
          this.hideModal(this.getModalInstance('categoryModal'));
        });
      } else {
        this.documentsService.CreateDocuments(this.documentsForm).subscribe((documents) => {
          this.documents.push({ ...documents, selected: false });
          this.showSuccessMessage("Thêm thành công!");
          this.hideModal(this.getModalInstance('categoryModal'));
        });
      }
    }
  }
   
  DeleteDocuments(id: number): void {
    this.selectedDocumentsId = id;
    this.showModal('deleteConfirmModal');
  }

  confirmDelete(): void {
    if (this.selectedDocumentsId !== null) {
      this.documentsService.DeleteDocuments(this.selectedDocumentsId).subscribe(() => {
        this.documents = this.documents.filter(c => c.id_document !== this.selectedDocumentsId);
        this.showSuccessMessage("Xóa danh sách thành công!");
        this.selectedDocumentsId = null;
      });
    }
  }

  toggleAll(event: Event): void {
    this.isAllSelected = (event.target as HTMLInputElement).checked;
    this.documents.forEach(documents => documents.selected = this.isAllSelected);
  }

  hasSelectedDocuments: boolean = false;

  deleteSelectedDocuments(): void {
    const selectedIds = this.documents.filter(documents => documents.selected).map(documents => documents.id_document);
    this.hasSelectedDocuments = selectedIds.length > 0;
    if (!this.hasSelectedDocuments) {
      // Nếu không có danh mục nào được chọn, hiển thị modal với thông báo
      this.showModal('deleteSelectedConfirmModal');
    } else {
      // Nếu có danh mục được chọn, hiển thị modal xác nhận
      this.showModal('deleteSelectedConfirmModal');
    }
  }

  confirmDeleteSelected(): void {
    const selectedIds = this.documents.filter(documents => documents.selected).map(documents => documents.id_document);
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        this.documentsService.DeleteDocuments(id).subscribe(() => {
          this.documents = this.documents.filter(documents => !selectedIds.includes(documents.id_document));
          this.showSuccessMessage("Xóa danh sách đã chọn thành công!");
        });
      });
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
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  resetForm(): void {
    this.documentsForm = {
      id_document: 0,
      title: '',
      id_category_document: 0,
      file_path: '',
      description_short: '',
      description: '',
      create_at: new Date().toISOString(), // Giữ nguyên ISO 8601
      id_account: 0,
      view_documents: 0,
      isVisible: true,
    };
  }
  /************************In danh sách*********************/
  exportOption: string = ''; // Biến lưu tùy chọn xuất

  // Hàm xử lý khi chọn tùy chọn xuất
  handleExport(): void {
    switch (this.exportOption) {
      case 'pdf':
        this.exportToPDF();
        break;
      case 'excel':
        this.exportToExcel();
        break;
      case 'print':
        this.printDirectly();
        break;
      default:
        console.log('Vui lòng chọn một tùy chọn hợp lệ');
    }
    this.exportOption = '';
  }

  // Xuất file PDF
  exportToPDF(): void {
    const element = document.getElementById('categoryTable');
    if (!element) return;

    html2canvas(element).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save('DanhSachVanBan.pdf');
    });
  }


  exportToExcel(): void {
    const worksheetData = this.filteredDocuments.map((document, index) => ({
      'STT': (this.page - 1) * this.pageSize + index + 1,
      'Tiêu đề': document.title,
      'Nội dung ngắn': document.description_short,
      'Nội dung chính': document.description,
      'Danh mục': this.getCategoryFullName(document),
      'Tài khoản': this.getAccounts_Name(document.id_account),
      'Ngày tạo': new Date(document.create_at).toLocaleDateString('vi-VN'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const header = ['STT', 'Tiêu đề', 'Nội dung ngắn', 'Nội dung chính', 'Danh mục', 'Tài khoản', 'Ngày tạo'] as const; // Tuple literal

    // Định dạng tiêu đề
    header.forEach((key, index) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: index });
      worksheet[cell].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'D9EAD3' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    });

    // Định dạng các ô dữ liệu
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cell]) continue;
        worksheet[cell].s = {
          alignment: {
            horizontal: C === 0 ? 'center' : 'left',
            vertical: 'center',
            wrapText: true
          },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    }

    // Điều chỉnh độ rộng cột
    const colWidths = header.map((key) => {
      const maxLength = Math.max(
        ...worksheetData.map(row => ((row[key] as string | number) || '').toString().length),
        key.length
      );
      return { wch: maxLength + 2 };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tin tức');
    XLSX.writeFile(workbook, 'DanhSachTinTuc.xlsx');
  }

  // In trực tiếp
  printDirectly(): void {
    const printContent = document.getElementById('categoryTable');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In danh sách văn bản</title>
            <style>
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid black; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body onload="window.print(); window.close()">
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  /***************Phân trang***************/
  get totalPages(): number {
    return Math.ceil(this.filteredDocuments.length / this.pageSize);
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  /*******File upload*************/
  fileToUpload: File | null = null;

  onPdfSelected(event: any) {
    const file: File = event.target.files[0];

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileToUpload = input.files[0];
      console.log("File được chọn:", this.fileToUpload);
        
      this.documentsForm.file_path = this.fileToUpload.name; // Gán tên file vào file_path
    }

    if (!file) {
      this.successMessage = "Vui lòng chọn một file PDF.";
      return;
    }

    // Kiểm tra định dạng file
    const fileType = file.type;
    const validTypes = ["application/pdf"];

    if (!validTypes.includes(fileType)) {
      this.successMessage = "Chỉ được phép tải lên file PDF.";
      event.target.value = ''; // Reset input file
    } else {
      this.successMessage = ''; // Xóa lỗi nếu chọn đúng PDF
    }
  }

  onParentIdChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.documentsForm.id_category_document = value === "null" || value === "" ? null : Number(value);
    console.log('parentId sau khi thay đổi:', this.documentsForm.id_category_document);
  }

  truncateHTML(content: string, limit: number = 100): string {
    if (!content) return '';
    return content.length > limit ? content.substring(0, limit) + '...' : content;
  }

  toggleVisibility(documents: Documents): void {
    this.documentsService.SetVisibility(documents.id_document, !documents.isVisible).subscribe(response => {
      documents.isVisible = !documents.isVisible;
    }, error => {
      console.error("Lỗi khi cập nhật trạng thái hiển thị", error);
    });
  }


  get totalPages1(): number {
    return Math.ceil(this.filteredPostPdf.length / this.pageSize);
  }

  // getPaginationArray1(): number[] {
  //   return Array(this.totalPages1).fill(0).map((_, i) => i + 1);
  // }

  getPaginationArray1(): (number | string)[] {
    const total = this.totalPages1;
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
  
  /**************************************Hiện chi tiết***********************************************/
  // Các hàm điều chỉnh font size
  increaseFontSize(): void {
    this.fontSize += 2;
  }

  decreaseFontSize(): void {
    if (this.fontSize > 10) {
      this.fontSize -= 2;
    }
  }

  // Thuộc tính component
  currentDomainIndex: number = 0;
  docDetail: any = null;
  fontSize: number = 14;
  fileUrl: string | null = null;
  selectedDocument: any = null;
  pdfLoaded: boolean = false;
  
  safeDetailPdfUrl: SafeResourceUrl | null = null;
  detailLoading: boolean = false;

  // Danh sách domain theo thứ tự ưu tiên
  domains: string[] = [
    'https://api.ttdt2503.id.vn',
    'https://api.ttdt03.id.vn',
    'https://api.congtt123.id.vn'
  ];

  // Mở modal xem chi tiết
  viewDetails(document: any): void {
    this.docDetail = document;
    this.selectedDocument = document;
    this.currentDomainIndex = 0;
    this.pdfLoaded = false;
    this.detailLoading = true;
    this.tryLoadDetailPdf();
    
    // Mở modal
    this.showModal('detailModal');
  }

  // Thử load PDF từ domain hiện tại
  tryLoadDetailPdf(): void {
    if (!this.selectedDocument?.file_path) {
        this.safeDetailPdfUrl = null;
        this.detailLoading = false;
        return;
    }

    const filePath = this.selectedDocument.file_path.replace(/\\/g, "/");
    const domain = this.domains[this.currentDomainIndex];
    const url = `${domain}/api/pdf/${filePath}`;

    this.http.head(url, { observe: 'response' }).subscribe({
        next: (response) => {
            if (response.status === 200) {
                this.safeDetailPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                this.detailLoading = false;
                this.pdfLoaded = true;
            } else {
                this.loadNextDomainForDetailPdf();
            }
        },
        error: () => {
            this.loadNextDomainForDetailPdf();
        },
    });
}

handleDetailPdfLoad(): void {
  this.pdfLoaded = true;
  this.detailLoading = false;
  console.log(`PDF loaded successfully from ${this.domains[this.currentDomainIndex]}`);
}

loadNextDomainForDetailPdf(): void {
  this.currentDomainIndex++;
  if (this.currentDomainIndex < this.domains.length) {
      this.tryLoadDetailPdf();
  } else {
      this.safeDetailPdfUrl = null;
      this.detailLoading = false;
      console.warn("Không thể load PDF từ bất kỳ domain nào.");
  }
}

  // Tải file PDF về máy
  downloadFile(): void {
    if (!this.selectedDocument?.file_path) return;
    
    // Sử dụng domain đầu tiên để download
    const domain = this.domains[0];
    const fileUrl = `${domain}/api/pdf/${this.selectedDocument.file_path}`;
    const fileName = this.selectedDocument.file_path.split('/').pop() || 'document.pdf';
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

}