import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ProceduresService } from '../procedures.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Procedure } from '../../../../Admin/admin/procedure/procedure.model';

@Component({
  selector: 'app-procedures-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './procedures-detail.component.html',
  styleUrl: './procedures-detail.component.css'
})
export class ProceduresDetailComponent implements OnInit {
  id_thutuc: string = '';
  detailProcedures!: Procedure;


  constructor(
    private route: ActivatedRoute,
    private proceduresService: ProceduresService,
    private titleService: Title, private metaService: Meta
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id_thutuc = decodeURIComponent(params.get('id_thutuc') || '');
  
      if (this.id_thutuc) {
        this.getProceduresDetail(this.id_thutuc);
      }
    });
  }

  getProceduresDetail(id: string): void {
    this.proceduresService.GetProceduresById_thutuc(id).subscribe(
      data => {
        this.detailProcedures = data;
        this.detailProcedures.formatText = this.detailProcedures.formatText
          .replace(/&nbsp;/g, ' ')  // Thay thế &nbsp; bằng dấu cách bình thường
          .replace(/\s+/g, ' ')     // Xóa khoảng trắng thừa
          .trim();                  // Loại bỏ khoảng trắng đầu & cuối
        console.log('Chi tiết thủ tục:', this.detailProcedures);
      },
      error => {
        console.log("Lỗi lấy chi tiết thủ tục!");
      }
    );
  }

}
