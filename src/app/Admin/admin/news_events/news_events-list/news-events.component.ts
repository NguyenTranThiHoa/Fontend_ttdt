import { Component, OnInit, ChangeDetectorRef, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import * as bootstrap from 'bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx'; 

import { News_Events } from '../news_events.model';
import { NewsEventsService } from '../news-events.service';
import { AccountsService } from '../../accounts/accounts.service';

import { QuillModule } from 'ngx-quill';
import Quill from 'quill';

import { Categories } from '../../categories/categories.component.model';
import { CategoriesService } from '../../categories/categories.service';

import { Folder } from '../../uploadfileImage/folder.model';
import { PostImage } from '../../uploadfileImage/postImage.model';
import { UploadfileImageService } from '../../uploadfileImage/uploadImage.service';
import { Accounts } from '../../../../Auth/Accounts.model';

@Component({
  selector: 'app-news-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxPaginationModule, QuillModule],
  templateUrl: './news-events.component.html',
  styleUrls: ['./news-events.component.css']
})
export class NewsEventsComponent implements OnInit {
  categories: Categories[] = [];
  news_events: News_Events[] = [];
  accounts: Accounts[] = [];

  news_eventsForm: News_Events = {
    id_newsevent: 0,
    title: '',
    description_short: '',
    content: '',
    id_categories: 0,
    id_account: 0,
    image: '',
    create_at: '',
    formatted_content: '',
    view: 0,
    selected: false,
    isVisible: true,
  };

  isEditMode = false;
  successMessage = '';
  page: number = 1;
  pageSize: number = 5;
  selectedCategoryId: number | null = null;
  isAllSelected: boolean = false;
  selectedNews_EventsId: number | null = null;
  searchQuery: string = '';
  selectedDate: string = '';


  exportOption: string = ''; // Biến lưu tùy chọn xuất

  imagePreview: string | null = null;

  username: string | null = null;
  role: string | null = null;
  id_account: number | null = null;

  constructor(
    private news_eventsService: NewsEventsService,
    private cdr: ChangeDetectorRef,
    private accountsService: AccountsService,
    private categoriesService: CategoriesService,
    private renderer: Renderer2,
    private router: Router,
    private uploadService: UploadfileImageService,
  ) { }

  ngOnInit(): void {
    this.loadNews_events();
    this.loadAccounts();
    this.loadCategories();
    this.loadFolder();
    this.loadPostImage();

    this.loadUserInfo();  
 
    this.apiDomains = [
      'https://api.ttdt2503.id.vn',
      'https://api.ttdt03.id.vn',
      'https://api.congtt123.id.vn',
    ]
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

  loadNews_events(): void {
    this.news_eventsService.GetNews_Events().subscribe(news_events => {
      this.news_events = news_events.map(ne => ({ ...ne, selected: false }));
      console.log('Dữ liệu news_events:', this.news_events); // Debug dữ liệu
      this.cdr.detectChanges();
    });
  }

  loadAccounts(): void {
    this.accountsService.GetAccounts().subscribe((data) => {
      this.accounts = data;
    });
  }

  loadCategories(): void {
    this.categoriesService.GetCategories().subscribe(categories => {
      this.categories = categories;
      console.log('Dữ liệu categories:', this.categories); // Debug danh mục
      this.cdr.detectChanges();
    });
  }

  // Hàm lấy tất cả ID của danh mục con từ một danh mục bất kỳ
  private getAllChildCategoryIds(categoryId: number, categories: Categories[], result: number[] = []): number[] {
    const findCategory = (cats: Categories[]): Categories | undefined => {
      for (const cat of cats) {
        if (cat.id_categories === categoryId) {
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
      result.push(category.id_categories); // Thêm ID của danh mục được chọn
      if (category.children && category.children.length > 0) {
        category.children.forEach(child => {
          this.getAllChildCategoryIds(child.id_categories, category.children, result); // Đệ quy lấy ID con
        });
      }
    }
    console.log(`Danh sách ID từ danh mục ${categoryId}:`, result);
    return result;
  }

  // Logic lọc dữ liệu
  get filteredNews_Events(): News_Events[] {
    let filtered = [...this.news_events];
    console.log('Dữ liệu trước khi lọc:', filtered);

    // Lọc theo danh mục (bao gồm danh mục được chọn và các danh mục con)
    if (this.selectedCategoryId !== null) {
      const allCategoryIds = this.getAllChildCategoryIds(this.selectedCategoryId, this.categories);
      filtered = filtered.filter(news_event =>
        news_event.id_categories !== null &&
        allCategoryIds.includes(news_event.id_categories)
      );
      console.log('Dữ liệu sau khi lọc danh mục:', filtered);
    }

    // Lọc theo ngày
    if (this.selectedDate) {
      filtered = filtered.filter(news_event => {
        const createAtDate = new Date(news_event.create_at).toISOString().split('T')[0];
        return createAtDate === this.selectedDate;
      });
      console.log('Dữ liệu sau khi lọc ngày:', filtered);
    }

    // Lọc theo tìm kiếm
    if (this.searchQuery) {
      filtered = filtered.filter(news_event =>
        (news_event.title?.toLowerCase() || '').includes(this.searchQuery.toLowerCase()) ||
        (news_event.content?.toLowerCase() || '').includes(this.searchQuery.toLowerCase())
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
    console.log('Sau khi lọc - filteredNews_Events:', this.filteredNews_Events); // Debug sau khi lọc
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

  getCategoryFullName(news_event: News_Events): string {
    let categoryNames: string[] = [];
    this.findCategoryHierarchy(this.categories, news_event.id_categories, categoryNames);
    return categoryNames.join(' > ') || 'Không xác định';
  }

  private findCategoryHierarchy(categories: Categories[], id: number | null, categoryNames: string[]): boolean {
    if (id === null) return false;

    for (const category of categories) {
      if (category.id_categories === id) {
        categoryNames.unshift(category.name_category);
        return true;
      }
      if (category.children && category.children.length > 0) {
        const found = this.findCategoryHierarchy(category.children, id, categoryNames);
        if (found) {
          categoryNames.unshift(category.name_category);
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

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('imageFile', file);

      this.news_eventsService.UploadImage(formData).subscribe(response => {
        this.news_eventsForm.image = response.imagePath;
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

  openCreateModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showModal('categoryModal');
  }

  // openEditModal(news_events: News_Events): void {
  //   this.isEditMode = true;
  //   this.news_eventsForm = { ...news_events };
  //   this.news_eventsForm.isVisible = news_events.isVisible; // ✅ Gán trạng thái
  //   this.imagePreview = news_events.image ? 'https://api.ttdt2503.id.vn/api/images/' + news_events.image : null;
  //   this.news_eventsForm.content = news_events.formatted_content; // Gán giá trị vào biến quillContent
  //   console.log('Danh sách được chọn để sửa:', this.news_eventsForm);
  //   this.showModal('categoryModal');
  // }

  openEditModal(news_events: News_Events): void {
    this.isEditMode = true;
    this.news_eventsForm = { ...news_events };
    this.news_eventsForm.isVisible = news_events.isVisible; // ✅ Gán trạng thái

    this.imagePreviewDomainIndex = 0; // reset domain fallback
    this.imagePreview = news_events.image || null; // Lưu path gốc thôi, domain xử lý bên HTML rồi

    this.news_eventsForm.content = news_events.formatted_content; // Gán content cho quill

    console.log('Danh sách được chọn để sửa:', this.news_eventsForm);
    this.showModal('categoryModal');
  }


  validateNewsEventsForm(): boolean {
    this.errorMessage = ''; // Reset lỗi trước khi kiểm tra

    const rawTitle = this.news_eventsForm.title;
    const title = rawTitle?.trim();
    const categoryId = this.news_eventsForm.id_categories;
    const content = this.news_eventsForm.content?.trim();
    const descriptionShort = this.news_eventsForm.description_short?.trim();
    const image = this.selectedImageName1;

    // Kiểm tra Tiêu đề Tin tức
    if (!title) {
        this.errorMessage = "Tiêu đề tin tức không được để trống!";
        return false;
    }

    // Kiểm tra khoảng trắng ở đầu/cuối
    if (rawTitle !== title) {
        this.errorMessage = "Tiêu đề tin tức không được có khoảng trắng ở đầu hoặc cuối!";
        return false;
    }

    // Cho phép chữ cái có dấu, số, khoảng trắng và , . / -
    const regex = /^[\p{L}0-9\s,./-]+$/u;
    if (!regex.test(title)) {
        this.errorMessage = "Tên tiêu đề tin tức chỉ được chứa chữ cái (có dấu), số, khoảng trắng và các dấu , . / -";
        return false;
    }

    // Kiểm tra tài khoản
    if (!this.news_eventsForm.id_account || this.news_eventsForm.id_account === 0) {
        this.errorMessage = "Vui lòng chọn tài khoản!";
        return false;
    }

    // Kiểm tra Danh mục
    if (!categoryId) {
        this.errorMessage = "Vui lòng chọn danh mục!";
        return false;
    }

    // Kiểm tra Nội dung Chính
    if (!content) {
        this.errorMessage = "Nội dung chính không được để trống!";
        return false;
    }

    // Kiểm tra Nội dung Tiêu đề Ngắn
    if (!descriptionShort) {
        this.errorMessage = "Nội dung tiêu đề ngắn không được để trống!";
        return false;
    }

    // Kiểm tra Hình ảnh
    if (!image) {
        this.errorMessage = "Vui lòng chọn hình ảnh!";
        return false;
    }

    return true;
  }

  saveNews_Events(): void {
    if (!this.validateNewsEventsForm()) {
      return;
    }

    const plainText = this.stripHtml(this.news_eventsForm.content);
    const formattedText = this.news_eventsForm.content;

    if (this.isEditMode) {
      this.news_eventsService.UpdateNews_Events(
        this.news_eventsForm.id_newsevent,
        { ...this.news_eventsForm, content: plainText, formatted_content: formattedText }
      ).subscribe(() => {
        this.loadNews_events();
        this.showSuccessMessage("Cập nhật thành công!");
        this.hideModal(this.getModalInstance('categoryModal'));
      }, error => {
        console.error("Lỗi khi cập nhật:", error);
      });
    } else {
      this.news_eventsService.CreateNews_Events({
        ...this.news_eventsForm,
        content: plainText,
        formatted_content: formattedText
      }).subscribe((newCategory) => {
        this.news_events.push({ ...newCategory, selected: false });
        this.showSuccessMessage("Thêm thành công!");
        this.hideModal(this.getModalInstance('categoryModal'));
      }, error => {
            console.error("❌ Lỗi khi thêm mới:", error);
            console.log("🔴 Dữ liệu lỗi gửi đi:", this.news_eventsForm);
      });
    }
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
  }

  DeleteNews_Events(id: number): void {
    this.selectedNews_EventsId = id;
    this.showModal('deleteConfirmModal');
  }

  confirmDelete(): void {
    if (this.selectedNews_EventsId !== null) {
      this.news_eventsService.DeleteNews_Events(this.selectedNews_EventsId).subscribe(() => {
        this.news_events = this.news_events.filter(c => c.id_newsevent !== this.selectedNews_EventsId);
        this.showSuccessMessage("Xóa danh sách thành công!");
        this.selectedNews_EventsId = null;
      });
    }
  }

  toggleAll(event: Event): void {
    this.isAllSelected = (event.target as HTMLInputElement).checked;
    this.news_events.forEach(news_event => news_event.selected = this.isAllSelected);
  }

  hasSelectedNews_Events: boolean = false;

  deleteSelectedNews_Events(): void {
    const selectedIds = this.news_events.filter(news_event => news_event.selected).map(news_event => news_event.id_newsevent);
    this.hasSelectedNews_Events = selectedIds.length > 0;
    this.showModal('deleteSelectedConfirmModal');
  }

  confirmDeleteSelected(): void {
    const selectedIds = this.news_events.filter(news_events => news_events.selected).map(news_events => news_events.id_newsevent);
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        this.news_eventsService.DeleteNews_Events(id).subscribe(() => {
          this.news_events = this.news_events.filter(news_events => !selectedIds.includes(news_events.id_newsevent));
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
    this.news_eventsForm = {
      id_newsevent: 0,
      title: '',
      content: '',
      id_categories: 0,
      id_account: 0,
      image: '',
      description_short: '',
      formatted_content: '',
      view: 0,
      selected: false,
      create_at: new Date().toISOString(),
      isVisible: true,
    };
    this.imagePreview = null;
  }

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
      pdf.save('DanhSachTinTuc.pdf');
    });
  }

  exportToExcel(): void {
    const worksheetData = this.filteredNews_Events.map((news_event, index) => ({
      'STT': (this.page - 1) * this.pageSize + index + 1,
      'Tiêu đề': news_event.title,
      'Nội dung ngắn': news_event.description_short,
      'Danh mục': this.getCategoryFullName(news_event),
      'Tài khoản': this.getAccounts_Name(news_event.id_account),
      'Ngày tạo': new Date(news_event.create_at).toLocaleDateString('vi-VN'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const header = ['STT', 'Tiêu đề', 'Nội dung ngắn', 'Danh mục', 'Tài khoản', 'Ngày tạo'] as const; // Tuple literal

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
    return Math.ceil(this.filteredNews_Events.length / this.pageSize);
  }

  getPaginationArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  get totalPages1(): number {
    return Math.ceil(this.filteredPostImage.length / this.pageSize);
  }

  getPaginationArray1(): number[] {
    return Array(this.totalPages1).fill(0).map((_, i) => i + 1);
  }

  /**************************Trang cho hình đại diện*************************/
  get totalPages2(): number {
    return Math.ceil(this.filteredPostImage.length / this.pageSize);
  }

  getPaginationArray2(): number[] {
    return Array(this.totalPages1).fill(0).map((_, i) => i + 1);
  }

  /****************************Editor***************************/
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

  /**Mở modal thêm bảng */
  openTableModal(): void {
    this.showTableModal = true;
    console.log("📌 Mở modal, giá trị hiện tại:", this.rows, "x", this.cols);
  }

  /**Đóng modal */
  closeTableModal(): void {
    this.showTableModal = false;
  }

  /**Cập nhật số hàng từ input */
  updateRows(event: any): void {
    const value = parseInt(event.target.value, 10);
    this.rows = isNaN(value) || value < 1 ? 1 : value;
    console.log("✅ Số hàng cập nhật:", this.rows);
  }

  /**Cập nhật số cột từ input */
  updateCols(event: any): void {
    const value = parseInt(event.target.value, 10);
    this.cols = isNaN(value) || value < 1 ? 1 : value;
    console.log("✅ Số cột cập nhật:", this.cols);
  }

  /**Chèn bảng vào Quill Editor */
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

  /********************************Trạng thái ẩn hiện********************************/
  toggleVisibility(newsEvent: News_Events): void {
    this.news_eventsService.SetVisibility(newsEvent.id_newsevent, !newsEvent.isVisible).subscribe(response => {
      newsEvent.isVisible = !newsEvent.isVisible;
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

  /******************************************Chọn ảnh từ giao diện****************************************************/
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
  
  // insertImageToEditor(imageUrl: string) {
  //   const quill = this.quillEditorInstance;
    
  //   if (quill) {
  //     const range = quill.getSelection(true); // ✅ Lấy vị trí con trỏ hiện tại
  //     if (range) {
  //       quill.insertEmbed(range.index, 'image', `https://api.ttdt2503.id.vn/api/images/${imageUrl}`);
  //       quill.setSelection(range.index + 1); // ✅ Di chuyển con trỏ sau ảnh
  //     }

  //     // ✅ Cập nhật nội dung `news_eventsForm.content`
  //     this.news_eventsForm.content = quill.root.innerHTML;
  //   }

  //   // ✅ Ẩn modal sau khi chọn ảnh
  //   const imageModalElement = document.getElementById('imageSelectorModal');
  //   if (imageModalElement) {
  //     const imageModalInstance = bootstrap.Modal.getInstance(imageModalElement) || new bootstrap.Modal(imageModalElement);
  //     imageModalInstance.hide();
  //   }

  //   console.log("✅ Ảnh đã chèn vào Quill:", `https://api.ttdt2503.id.vn/api/images/${imageUrl}`);
  // }

  getFullImageUrl(imagePath: string, domainIndex = 0): string {
    const safePath = this.getSafeImagePath(imagePath);
    const domain = this.apiDomains[domainIndex] || this.apiDomains[0];
    return `${domain}/api/images/${safePath}`;
  }

  insertImageToEditor(image: any) {
    const quill = this.quillEditorInstance;

    if (quill) {
      const range = quill.getSelection(true);
      if (range) {
        const domain = this.apiDomains[image.domainIndex] || this.apiDomains[0];
        const filePath = this.getSafeImagePath(image.filePath || '');

        quill.insertEmbed(range.index, 'image', `${domain}/api/images/${filePath}`);
        quill.setSelection(range.index + 1);
      }

      this.news_eventsForm.content = quill.root.innerHTML;
    }

    const imageModalElement = document.getElementById('imageSelectorModal');
    if (imageModalElement) {
      const imageModalInstance = bootstrap.Modal.getInstance(imageModalElement) || new bootstrap.Modal(imageModalElement);
      imageModalInstance.hide();
    }

    console.log("✅ Ảnh đã chèn vào Quill:", image);
  }


  selectedImageName: string = "";

  // selectImage(imagePath: string, imageName: string) {
  //   this.selectedImageName = imageName;
  //   this.imagePreview = `https://api.ttdt2503.id.vn/api/images/${imagePath}`;

  //   // Ẩn modal sau khi chọn ảnh
  //   const modalElement = document.getElementById('imageSelectorModal');
  //   if (modalElement) {
  //     (new bootstrap.Modal(modalElement)).hide();
  //   }
  // }

  selectImage(imagePath: string, imageName: string) {
    this.selectedImageName = imageName;

    this.imagePreview = this.getImageUrl({ filePath: imagePath, domainIndex: 0 });

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

  // selectImage1(imagePath: string, imageName: string) {
  //   // Lưu đường dẫn ảnh vào form
  //   this.news_eventsForm.image = imagePath;

  //   // Hiển thị tên ảnh trong input
  //   this.selectedImageName1 = imageName;

  //   // Hiển thị ảnh xem trước
  //   this.imagePreview = `https://api.ttdt2503.id.vn/api/images/${imagePath}`;

  //   // Ẩn modal sau khi chọn ảnh
  //   const modalElement = document.getElementById('imageSelectorModal1');
  //   if (modalElement) {
  //       const modalInstance = bootstrap.Modal.getInstance(modalElement); // Lấy instance modal đã mở
  //       if (modalInstance) {
  //           modalInstance.hide();
  //       }
  //   }
  // }

  // selectImage1(imagePath: string, imageName: string) {
  //   this.news_eventsForm.image = imagePath;
  //   this.selectedImageName1 = imageName;

  //   this.imagePreview = this.getImageUrl({ filePath: imagePath, domainIndex: 0 });  // Luôn start từ domain đầu tiên

  //   const modalElement = document.getElementById('imageSelectorModal1');
  //   if (modalElement) {
  //     const modalInstance = bootstrap.Modal.getInstance(modalElement);
  //     if (modalInstance) {
  //       modalInstance.hide();
  //     }
  //   }
  // }

  selectImage1(imagePath: string, imageName: string) {
    this.news_eventsForm.image = imagePath;
    this.selectedImageName1 = imageName;
    this.imagePreview = imagePath;  // <- thêm dòng này để xem trước
    const modalElement = document.getElementById('imageSelectorModal1');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  getSafeImagePath(imagePath: string): string {
    return imagePath.replace(/\\/g, "/"); // Đảm bảo đúng định dạng URL
  }
  
  // Hiện ra doamin cho cả 3
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

  /*************************************************/
  getImageWithFallback(imagePath: string, domainIndex: number = 0): string {
    const safePath = this.getSafeImagePath(imagePath);
    const domain = this.apiDomains[domainIndex] || this.apiDomains[0];
    return `${domain}/api/images/${safePath}`;
  }

  getImageUrlWithFallback(obj: any, field: string): string {
    const domainIndex = obj.domainIndex ?? 0;
    return this.getImageWithFallback(obj[field], domainIndex);
  }

  handleImageError1(event: Event, obj: any, field: string): void {
    if (obj.domainIndex === undefined || obj.domainIndex === null) {
      obj.domainIndex = 0; // Gán lần đầu
    }
  
    obj.domainIndex++;
  
    if (obj.domainIndex < this.apiDomains.length) {
      const target = event.target as HTMLImageElement;
      target.src = this.getImageWithFallback(obj[field], obj.domainIndex);
    } else {
      console.warn('❌ Không còn domain fallback khả dụng cho ảnh:', obj[field]);
    }
  }

  /*****************************Domain đại diện**************************/
  imagePreviewDomainIndex: number = 0;

  getImageWithFallbackString(path: string, domainIndex: number = 0): string {
    const safePath = this.getSafeImagePath(path);
    const domain = this.apiDomains[domainIndex] || this.apiDomains[0];
    return `${domain}/api/images/${safePath}`;
  }

  handleImageErrorPreview(event: Event, path: string): void {
    if (!(this.imagePreviewDomainIndex >= 0)) {
      this.imagePreviewDomainIndex = 0;
    }
    this.imagePreviewDomainIndex++;
    if (this.imagePreviewDomainIndex < this.apiDomains.length) {
      const target = event.target as HTMLImageElement;
      target.src = this.getImageWithFallbackString(path, this.imagePreviewDomainIndex);
    } else {
      console.warn('❌ Không còn domain fallback khả dụng cho ảnh preview:', path);
    }
  }

}
