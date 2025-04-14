import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { LayoutsComponent } from './app/Admin/Admin_Layouts/layouts.component';
import { DasboardComponent } from './app/Admin/admin/dasboard/dasboard.component';

import { AccountsListComponent } from './app/Admin/admin/accounts/accounts-list/accounts.component';
import { CategoriesDocumentsComponent } from './app/Admin/admin/categories-documents/categories-documents-list/categories-documents.component';
import { DocumentsComponent } from './app/Admin/admin/documents/documents-list/documents.component';
import { NewsEventsComponent } from './app/Admin/admin/news_events/news_events-list/news-events.component';

import { UserLayoutComponent } from './app/User/user-layout/user-layout.component';
import { HomeComponent_user } from './app/User/User/Home/home/home.component';
import { CategoriesComponent_user } from './app/User/User/Categories/categories/categories.component';
import { CategoryDetailComponent } from './app/User/User/Categories/category-detail/category-detail.component';
import { CategoriesComponent } from './app/Admin/admin/categories/categories-list/categories.component';

import { CategoryDocComponent } from './app/User/User/Catelogy_Doc/category-doc/category-doc.component';
import { CategoryDocDetailComponent } from './app/User/User/Catelogy_Doc/category-doc-detail/category-doc-detail.component';
import { CategoriesIntroduceComponent } from './app/Admin/admin/categories-introduce/categories-introduce-list/categories-introduce.component';
import { IntroduceComponent } from './app/User/User/Introduce/introduce/introduce.component';
import { IntroduceDetailComponent } from './app/User/User/Introduce/introduce-detail/introduce-detail.component';
import { CategoriesFieldComponent } from './app/Admin/admin/categories-procedure/categories-procedure-list/categories_procedure.component';
import { ProcedureComponent } from './app/Admin/admin/procedure/procedure-list/procedure.component';
import { FeedbacksComponent } from './app/Admin/admin/feedbacks/feedbacks.component';
import { ProceduresDetailComponent } from './app/User/User/Procedures/procedures-detail/procedures-detail.component';
import { ProceduresComponent } from './app/User/User/Procedures/procedures/procedures.component';
import { FeedBackComponent } from './app/User/User/Feed-back/feed-back.component';
import { UploadfileImageListComponent } from './app/Admin/admin/uploadfileImage/uploadfile-image-list/uploadfile-image-list.component';
import { UploadfilePdfListComponent } from './app/Admin/admin/uploadfile-pdf/uploadfile-pdf-list/uploadfile-pdf-list.component';
import { SearchComponent } from './app/User/User/Search/search/search.component';

import { AuthGuard } from './app/Auth/auth.guard';
import { LoginComponent } from './app/Auth/login/login.component';
import { RegisterComponent } from './app/Auth/register/register.component';
import { ForgotpasswordComponent } from './app/Auth/forgotpassword/forgotpassword.component';
import { AccountsInfoComponent } from './app/Admin/admin/accounts/accounts-info/accounts-info.component';

export const routes: Routes = [

  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/app-forgotpassword', component: ForgotpasswordComponent },
  // { path: '**', redirectTo: 'auth/login' }, // Mặc định về login
  {
    path: 'admin',
    component: LayoutsComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DasboardComponent, pathMatch: 'full' },
      { path: 'app-dashboard', component: DasboardComponent },
      { path: 'app-categories', component: CategoriesComponent },
      { path: 'app-categories-documents', component: CategoriesDocumentsComponent },
      { path: 'app-documents', component: DocumentsComponent },
      { path: 'app-news-events', component: NewsEventsComponent },
      { path: 'app-categories-field', component: CategoriesFieldComponent },
      { path: 'app-procedure', component: ProcedureComponent },
      { path: 'app-categories-introduce', component: CategoriesIntroduceComponent },
      { path: 'app-feedbacks', component: FeedbacksComponent },
      { path: 'app-uploadfile-image-list', component: UploadfileImageListComponent },
      { path: 'app-uploadfile-pdf-list', component: UploadfilePdfListComponent },
      { path: 'app-accounts', component: AccountsListComponent },
      { path: 'app-accounts-info', component: AccountsInfoComponent },
    ]
  },
 
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', component: HomeComponent_user, pathMatch: 'full' },
      { path: 'home', component: HomeComponent_user },
      { path: 'news-detail/:nameNews', component: CategoryDetailComponent},
        
      { path: 'news_events/:name', component: CategoriesComponent_user},  // Cấp 1
      { path: 'news_events/:name/:nameNews', component: CategoryDetailComponent},

      { path: 'document/:name', component: CategoryDocComponent},   //cấp 1
      { path: 'document/:name/:nameDocs', component: CategoryDocDetailComponent },
      { path: 'document-detail/:nameDocs', component: CategoryDocDetailComponent },
     
      { path: 'introduce/:name', component: IntroduceComponent},
      { path: 'introduce-detail/:nameIntro', component: IntroduceDetailComponent},
      { path: 'introduce/:name/:nameIntro', component: IntroduceDetailComponent},

      { path: 'procedures', component: ProceduresComponent},
      { path: 'procedures/:id_thutuc', component: ProceduresDetailComponent},
      
      { path: 'feedback', component: FeedBackComponent },
      { path: 'search/:query', component: SearchComponent},
    ]
  },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

