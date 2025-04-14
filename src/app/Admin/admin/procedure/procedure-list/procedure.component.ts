import { Component, OnInit, ChangeDetectorRef, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';

import { Procedure } from '../procedure.model';
import { Categogy_field } from '../../categories-procedure/categories_procedure.model';
import { ProcedureService } from '../procedure.service';
import { AccountsService } from '../../accounts/accounts.service';
import { CategoriesFieldeService } from '../../categories-procedure/categories_procedure.service';
import { Folder } from '../../uploadfileImage/folder.model';
import { PostImage } from '../../uploadfileImage/postImage.model';
import { UploadfileImageService } from '../../uploadfileImage/uploadImage.service';
import { Accounts } from '../../../../Auth/Accounts.model';


@Component({
  selector: 'app-procedure',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule, QuillModule],
  templateUrl: './procedure.component.html',
  styleUrl: './procedure.component.css'
})
export class ProcedureComponent implements OnInit {
  procedure: Procedure[] = [];
  categories_field: Categogy_field[] = []
  accounts: Accounts[] = [];

  procedureForm: Procedure = {
    id_procedures: 0,
    id_thutuc: '',
    name_procedures: '',
    id_Field: 0,
    description: '',
    create_at: '',
    date_issue: '',
    id_account: 0,
    formatText: '',
    selected: false,
    isVisible: true,
  };

  isEditMode = false;
  successMessage = '';
  page: number = 1;
  pageSize: number = 5;
  selectedCategoryId: number | null = null;
  isAllSelected: boolean = false;
  selectedProcedureId: number | null = null;
  searchQuery: string = '';
  selectedDate: string = '';

  exportOption: string = '';

  username: string | null = null;
  role: string | null = null;
  id_account: number | null = null;

  constructor(
    private procedureService: ProcedureService,
    private cdr: ChangeDetectorRef,
    private accountsService: AccountsService,
    private categories_fieldService: CategoriesFieldeService,
    private uploadService: UploadfileImageService,
  ) { }

  ngOnInit(): void {
    this.loadProcedure();
    this.loadAccounts();
    this.loadCategories_field();
    this.loadFolder();  // Load danh sách thư mục
    this.loadPostImage();   // Load danh sách ảnh

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

  loadProcedure(): void {
    this.procedureService.GetProcedures().subscribe(news_events => {
      this.procedure = news_events.map(ne => ({ ...ne, selected: false }));
      console.log('Dữ liệu news_events:', this.procedure); // Debug dữ liệu
      this.cdr.detectChanges();
    });
  }

  loadAccounts(): void {
    this.accountsService.GetAccounts().subscribe((data) => {
      this.accounts = data;
    });
  }

  loadCategories_field(): void {
    this.categories_fieldService.GetCategory_field().subscribe(categories => {
      this.categories_field = categories;
      console.log('Dữ liệu categories:', this.categories_field);
      this.cdr.detectChanges();
    });
  }

  private getAllChildCategoryIds(categoryId: number, categories_field: Categogy_field[], result: number[] = []): number[] {
    const findCategory = (cats: Categogy_field[]): Categogy_field | undefined => {
      for (const cat of cats) {
        if (cat.id_Field === categoryId) {
          return cat;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const category = findCategory(categories_field);
    if (category) {
      result.push(category.id_Field);
      if (category.children && category.children.length > 0) {
        category.children.forEach(child => {
          this.getAllChildCategoryIds(child.id_Field, category.children, result);
        });
      }
    }
    console.log(`Danh sách ID từ danh mục ${categoryId}:`, result);
    return result;
  }

  // Logic lọc dữ liệu
  get filteredProcedure(): Procedure[] {
    let filtered = [...this.procedure];
    console.log('Dữ liệu trước khi lọc:', filtered);

    // Lọc theo danh mục (bao gồm danh mục được chọn và các danh mục con)
    if (this.selectedCategoryId !== null) {
      const allCategoryIds = this.getAllChildCategoryIds(this.selectedCategoryId, this.categories_field);
      filtered = filtered.filter(news_event =>
        news_event.id_Field !== null &&
        allCategoryIds.includes(news_event.id_Field)
      );
      console.log('Dữ liệu sau khi lọc danh mục:', filtered);
    }
    
    // Lọc theo ngày
    if (this.selectedDate) {
      const selectedDateFormatted = this.selectedDate; // selectedDate đã có định dạng yyyy-MM-dd
      filtered = filtered.filter(procedure => {
        const createAtDate = new Date(procedure.create_at).toISOString().split('T')[0]; // Lấy phần ngày
        return createAtDate === selectedDateFormatted; // So sánh ngày
      });
      console.log('Dữ liệu sau khi lọc ngày:', filtered);
    }

    // Lọc theo tìm kiếm
    if (this.searchQuery) {
      filtered = filtered.filter(procedure =>
        (procedure.name_procedures?.toLowerCase() || '').includes(this.searchQuery.toLowerCase())
      );
      console.log('Dữ liệu sau khi lọc tìm kiếm:', filtered);
    }

    return filtered;
  }

  // Khi thay đổi danh mục
  filterByCategory(): void {
    console.log('Trước khi lọc - selectedCategoryId:', this.selectedCategoryId); // Debug trước khi lọc
    this.page = 1;
    this.cdr.detectChanges();
    console.log('Sau khi lọc - filteredProcedure:', this.filteredProcedure); // Debug sau khi lọc
  }

  // Khi thay đổi ngày
  filterByDate(): void {
    this.page = 1;
    console.log('Lọc theo ngày, selectedDate:', this.selectedDate);
    this.cdr.detectChanges();
  }

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategoryId = value === "null" ? null : Number(value);
    console.log('Dropdown thay đổi, selectedCategoryId:', this.selectedCategoryId);
    this.filterByCategory();
  }

  getCategoryFullName(procedure: Procedure): string {
    let categoryNames: string[] = [];
    this.findCategoryHierarchy(this.categories_field, procedure.id_Field, categoryNames);
    return categoryNames.join(' > ') || 'Không xác định';
  }

  private findCategoryHierarchy(categories_field: Categogy_field[], id: number | null, categoryNames: string[]): boolean {
    if (id === null) return false;

    for (const category of categories_field) {
      if (category.id_Field === id) {
        categoryNames.unshift(category.name_Field);
        return true;
      }
      if (category.children && category.children.length > 0) {
        const found = this.findCategoryHierarchy(category.children, id, categoryNames);
        if (found) {
          categoryNames.unshift(category.name_Field);
          return true;
        }
      }
    }
    return false;
  }

  getAccounts_Name(id_account: number): string {
    const account = this.accounts.find((loc) => loc.id_account === id_account);
    return account ? account.username : 'Không xác định';
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showModal('categoryModal');
  }

  openEditModal(procedure: Procedure): void {
    this.isEditMode = true;
    this.procedureForm = { ...procedure };
    this.procedureForm.isVisible = procedure.isVisible; // ✅ Gán trạng thái
    this.procedureForm.description = procedure.formatText; // Gán giá trị vào biến quillContent
    console.log('Danh sách được chọn để sửa:', this.procedureForm);
    this.showModal('categoryModal');
  }

  validateprocedureForm(): boolean {
    const name_procedures = this.procedureForm.name_procedures?.trim();
    const id_thutuc = this.procedureForm.id_thutuc?.trim();
    const id_account = this.procedureForm.id_account;
    const id_Field = this.procedureForm.id_Field;
    const description = this.procedureForm.description?.trim();
    const date_issue = this.procedureForm.date_issue ? new Date(this.procedureForm.date_issue) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Kiểm tra Tiêu đề Thủ tục
    if (!name_procedures) {
        this.errorMessage = "Tiêu đề thủ tục không được để trống!";
        return false;
    }

    // Kiểm tra khoảng trắng ở đầu hoặc cuối
    if (this.procedureForm.name_procedures !== name_procedures) {
        this.errorMessage = "Tiêu đề thủ tục không được có khoảng trắng ở đầu hoặc cuối!";
        return false;
    }

    // Biểu thức chính quy cho phép chữ cái có dấu, số, khoảng trắng và , . / -
    const regex = /^[\p{L}0-9\s,./-]+$/u;
    if (!regex.test(name_procedures)) {
        this.errorMessage = "Tiêu đề thủ tục chỉ được chứa chữ cái (có dấu), số, khoảng trắng và các dấu , . / -";
        return false;
    }

    if (!id_thutuc) {
        this.errorMessage = "Mã thủ tục không được để trống!";
        return false;
    }

    if (!id_account || id_account === 0) {
        this.errorMessage = "Vui lòng chọn tài khoản!";
        return false;
    }

    if (!id_Field) {
        this.errorMessage = "Vui lòng chọn danh mục lĩnh vực!";
        return false;
    }

    if (!description) {
        this.errorMessage = "Nội dung chính không được để trống!";
        return false;
    }

    if (!date_issue) {
        this.errorMessage = "Vui lòng chọn ngày ban hành!";
        return false;
    }

    if (date_issue < today) {
        this.errorMessage = "Ngày ban hành không được nhỏ hơn ngày hiện tại!";
        return false;
    }

    return true;
  }

  saveProcedure(): void {
    if (!this.validateprocedureForm()) {
      return;
    }
    // In dữ liệu gửi đi
    console.log("Dữ liệu gửi đi:", this.procedureForm);

    // Chuyển đổi ngày về định dạng ISO 8601 giống "create_at"
    this.procedureForm.date_issue = new Date(this.procedureForm.date_issue).toISOString();

    const plainText = this.stripHtml(this.procedureForm.description);
    const formattedText = this.procedureForm.description;

    if (this.isEditMode) {
      this.procedureService.UpdateProcedures(
        this.procedureForm.id_procedures,
        { ...this.procedureForm, description: plainText, formatText: formattedText }
      ).subscribe(() => {
        this.loadProcedure();
        this.showSuccessMessage("Cập nhật thành công!");
        this.hideModal(this.getModalInstance('categoryModal'));
      }, error => {
        console.error("Lỗi khi cập nhật:", error);
      });
    } else {
      this.procedureService.CreateProcedures({
        ...this.procedureForm,
        description: plainText,
        formatText: formattedText
      }).subscribe((newCategory) => {
        this.procedure.push({ ...newCategory, selected: false });
        this.showSuccessMessage("Thêm thành công!");
        this.hideModal(this.getModalInstance('categoryModal'));
      }, error => {
        console.error("Lỗi khi thêm mới:", error);
      });
    }
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
  }

  DeleteProcedure(id: number): void {
    this.selectedProcedureId = id;
    this.showModal('deleteConfirmModal');
  }

  confirmDelete(): void {
    if (this.selectedProcedureId !== null) {
      this.procedureService.DeleteProcedures(this.selectedProcedureId).subscribe(() => {
        this.procedure = this.procedure.filter(c => c.id_procedures !== this.selectedProcedureId);
        this.showSuccessMessage("Xóa danh sách thành công!");
        this.selectedProcedureId = null;
      });
    }
  }

  toggleAll(event: Event): void {
    this.isAllSelected = (event.target as HTMLInputElement).checked;
    this.procedure.forEach(procedure => procedure.selected = this.isAllSelected);
  }

  hasSelectedProcedure: boolean = false;

  deleteSelectedProcedure(): void {
    const selectedIds = this.procedure.filter(procedure => procedure.selected).map(procedure => procedure.id_procedures);
    this.hasSelectedProcedure = selectedIds.length > 0;
    this.showModal('deleteSelectedConfirmModal');
  }

  confirmDeleteSelected(): void {
    const selectedIds = this.procedure.filter(procedure => procedure.selected).map(procedure => procedure.id_procedures);
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        this.procedureService.DeleteProcedures(id).subscribe(() => {
          this.procedure = this.procedure.filter(procedure => !selectedIds.includes(procedure.id_procedures));
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
    this.procedureForm = {
      id_procedures: 0,
      id_thutuc: '',
      name_procedures: '',
      id_Field: 0,
      description: '',
      date_issue: new Date().toISOString().slice(0, 16), // Lấy YYYY-MM-DDTHH:mm
      id_account: 0,
      formatText: '',
      selected: false,
      create_at: new Date().toISOString(),
      isVisible: true,
    };
  }

  // Hàm xử lý khi chọn tùy chọn xuất
  handleExport(): void {
    switch (this.exportOption) {
      case 'pdf':
        this.exportToPDF();
        break;
      case 'print':
        this.printDirectly();
        break;
      default:
        console.log('Vui lòng chọn một tùy chọn hợp lệ');
    }
    this.exportOption = ''; // Reset sau khi thực hiện
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
      pdf.save('DanhSachTinTuc.pdf');
    });
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
            <title>In danh sách tin tức</title>
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

  get totalPages(): number {
    return Math.ceil(this.filteredProcedure.length / this.pageSize);
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  /**************************************************************************/

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
        image: () => this.openImageSelectorModal(),
        table: () => this.openTableModal(),  
      }           
    },
    theme: 'snow',
    placeholder: 'Nhập nội dung...',
    readOnly: false,
  };

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

  truncateHTML(content: string, limit: number = 100): string {
    if (!content) return '';
    return content.length > limit ? content.substring(0, limit) + '...' : content;
  }

  toggleVisibility(procedure: Procedure): void {
    this.procedureService.SetVisibility(procedure.id_procedures, !procedure.isVisible).subscribe(response => {
      procedure.isVisible = !procedure.isVisible;
    }, error => {
      console.error("Lỗi khi cập nhật trạng thái hiển thị", error);
    });
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
  
          
    quillEditorInstance: any;
    insertImageToEditor(imageUrl: string) {
    const quill = this.quillEditorInstance;
    
    if (quill) {
      const range = quill.getSelection(true); // ✅ Lấy vị trí con trỏ hiện tại
      if (range) {
        quill.insertEmbed(range.index, 'image', `https://api.ttdt2503.id.vn/api/images/${imageUrl}`);
        quill.setSelection(range.index + 1); // ✅ Di chuyển con trỏ sau ảnh
      }
  
      // ✅ Cập nhật nội dung `news_eventsForm.content`
      this.procedureForm.description = quill.root.innerHTML;
    }
  
    // ✅ Ẩn modal sau khi chọn ảnh
    const imageModalElement = document.getElementById('imageSelectorModal');
    if (imageModalElement) {
      const imageModalInstance = bootstrap.Modal.getInstance(imageModalElement) || new bootstrap.Modal(imageModalElement);
      imageModalInstance.hide();
    }
  
    console.log("✅ Ảnh đã chèn vào Quill:", `https://api.ttdt2503.id.vn/api/images/${imageUrl}`);
  }
  
    
    selectedImageName: string = "";
  
    selectImage(imagePath: string, imageName: string) {
      this.selectedImageName = imageName;
      this.imagePreview = `https://api.ttdt2503.id.vn/api/images/${imagePath}`;
  
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
  
  imagePreview: string | null = null;
  
  // Domain cho cả 2
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










