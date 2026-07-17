import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionService } from '../../core/services/session.service';
import { FacilityBuilderStateService } from './state/facility-builder-state.service';

@Component({
  selector: 'app-admin-portal-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <mat-sidenav-container autosize class="h-screen w-screen overflow-hidden bg-slate-50">
      <mat-sidenav #drawer
                   [mode]="isMobile() ? 'over' : 'side'"
                   [opened]="!isMobile()"
                   class="transition-all duration-300 ease-in-out border-r border-slate-200"
                   style="background: #ffffff; color: #1e293b;"
                   [style.width]="isMobile() ? '280px' : (isCollapsed() ? '80px' : '280px')">
        <div class="flex h-full flex-col overflow-hidden" [ngClass]="(!isMobile() && isCollapsed()) ? 'py-5' : 'px-5 py-5'">
          <!-- Logo Header -->
          <div class="mb-6 flex flex-col" [ngClass]="(!isMobile() && isCollapsed()) ? 'px-4' : ''">
            <!-- Accent Strip -->
            <div *ngIf="isMobile() || !isCollapsed()" style="height:3px;border-radius:2px;background:linear-gradient(90deg,#818cf8 0% 34%,#14B8A6 34% 68%,#F59E0B 68% 100%);margin-bottom:1.25rem;"></div>

            <div class="flex items-center justify-between w-full">
              <!-- Logo -->
              <img *ngIf="isMobile() || !isCollapsed()"
                class="hyland-logo"
                src="https://www.gartner.com/pi/vendorimages/hyland-software_bpm-platform-based-case-management-frameworks_1742417574803.png"
                alt="Hyland logo"
                style="width: 138px; height: 40px; object-fit: contain; object-position: left center;"
              />
              <!-- Desktop collapse toggle -->
              <button *ngIf="!isMobile()" type="button"
                      (click)="toggleSidebar()"
                      class="flex items-center justify-center shrink-0 border-none bg-transparent cursor-pointer rounded-md transition-colors"
                      [ngClass]="isCollapsed() ? 'w-8 h-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'w-7 h-7 text-slate-400 hover:text-slate-800 hover:bg-slate-100'"
                      title="Toggle sidebar">
                <mat-icon class="!text-[20px]">{{ isCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
              </button>
              <!-- Mobile close button -->
              <button *ngIf="isMobile()" type="button"
                      (click)="closeMobileDrawer()"
                      class="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Close menu">
                <mat-icon class="!text-[20px]">close</mat-icon>
              </button>
            </div>
            
            <ng-container *ngIf="isMobile() || !isCollapsed()">
              <p class="mt-4 text-[1.05rem] font-bold text-slate-800 tracking-wide">Admin Portal</p>
              <p class="mt-2 text-[0.8rem] text-slate-500 leading-relaxed max-w-[220px]">Manage operations, policy rules, and communication feeds in one workspace.</p>
            </ng-container>
          </div>

          <!-- Nav Items -->
          <nav class="space-y-1.5 flex-1 mt-2" [ngClass]="(!isMobile() && isCollapsed()) ? 'px-2' : ''">
            <a *ngFor="let item of navItems"
               [routerLink]="item.link"
               routerLinkActive="!bg-brand-50 !text-brand-600 font-semibold"
               class="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-slate-100 hover:text-slate-900 text-slate-600"
               (click)="closeMobileDrawer()">
              <mat-icon class="!text-[22px] shrink-0" [matTooltip]="(!isMobile() && isCollapsed()) ? item.label : ''" matTooltipPosition="right">{{ item.icon }}</mat-icon>
              <span *ngIf="isMobile() || !isCollapsed()" class="truncate text-[0.85rem]">{{ item.label }}</span>
            </a>
          </nav>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="bg-slate-50 flex flex-col h-screen">
        <mat-toolbar class="!sticky !top-0 !z-30 !h-[76px] glass-panel !bg-white/80 !px-4 !shadow-sm md:!px-6 !border-t-0 !border-l-0 !border-r-0 !border-b !border-slate-200 shrink-0">
          
          <!-- Mobile hamburger ☰ (phones only) -->
          <button type="button" (click)="toggleMobileDrawer()" class="flex md:hidden items-center justify-center w-9 h-9 mr-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0">
            <mat-icon class="!text-[22px]">menu</mat-icon>
          </button>

          <div class="portal-search hidden w-[340px] items-center gap-2 px-3 py-2 md:flex">
            <mat-icon class="!text-[20px] text-slate-500">search</mat-icon>
            <input class="w-full bg-transparent text-sm outline-none" 
                   placeholder="Search facilities, fields, and rules"
                   [value]="facilityState.searchTerm()"
                   (input)="onSearchInput($event)" />
          </div>

          <span class="flex-1"></span>

          <button mat-button [matMenuTriggerFor]="profileMenu" class="!min-w-0 !p-0 !rounded-full">
             <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-200 transition shadow-sm">
              {{ sessionService.state()?.user?.name?.charAt(0) || 'A' }}
            </div>
          </button>

          <mat-menu #profileMenu="matMenu">
            <div class="px-4 py-3 border-b border-slate-100 mb-1">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
              <p class="text-sm font-bold text-slate-800">{{ sessionService.state()?.user?.name || 'Admin' }}</p>
            </div>

            <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Sign Out</span></button>
          </mat-menu>
        </mat-toolbar>

        <main class="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `
})
export class AdminPortalShellComponent implements OnInit, OnDestroy {
  readonly navItems = [
    { label: 'Dashboard', icon: 'dashboard', link: '/admin/dashboard' },
    { label: 'Facilities', icon: 'apartment', link: '/admin/facilities' },
    { label: 'Form Builder', icon: 'construction', link: '/admin/form-builder' },
    { label: 'Rules', icon: 'rule', link: '/admin/rules' },
    { label: 'Notifications', icon: 'notifications_active', link: '/admin/notifications' },
    { label: 'Reports', icon: 'bar_chart', link: '/admin/reports' },
    { label: 'Data Store', icon: 'storage', link: '/admin/data-store' },
    { label: 'Employees', icon: 'group', link: '/admin/employees' }
  ];
  @ViewChild('drawer') private drawerRef!: MatSidenav;
  readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 768);
  readonly isCollapsed = signal(false);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminApi: AdminApiService,
    public readonly sessionService: SessionService,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
    public readonly facilityState: FacilityBuilderStateService
  ) {}

  ngOnInit(): void {
  }

  toggleSidebar(): void {
    this.isCollapsed.update((c) => !c);
  }

  toggleMobileDrawer(): void {
    void this.drawerRef.toggle();
  }

  closeMobileDrawer(): void {
    if (this.isMobile()) {
      void this.drawerRef.close();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    const mobile = window.innerWidth < 768;
    const wasMobile = this.isMobile();
    this.isMobile.set(mobile);
    if (mobile && !wasMobile) {
      void this.drawerRef.close();
    } else if (!mobile && wasMobile) {
      void this.drawerRef.open();
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.facilityState.searchTerm.set(value);
    
    if (value.trim().length > 0 && !this.router.url.includes('/admin/facilities')) {
      this.router.navigateByUrl('/admin/facilities');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goEmployeeView(): void {
    this.router.navigateByUrl('/employee/dashboard');
  }

  logout(): void {
    const token = this.sessionService.getToken();
    if (!token) {
      this.sessionService.clear();
      this.router.navigateByUrl('/login');
      return;
    }

    this.authApi.logout(token).subscribe({
      next: () => {
        this.sessionService.clear();
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.sessionService.clear();
        this.router.navigateByUrl('/login');
      }
    });
  }

}
