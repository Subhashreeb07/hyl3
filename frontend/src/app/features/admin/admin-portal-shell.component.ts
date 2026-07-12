import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminApiService } from '../../core/services/admin-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionService } from '../../core/services/session.service';

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
    MatBadgeModule
  ],
  template: `
    <mat-sidenav-container class="h-screen w-screen overflow-hidden bg-white">
      <mat-sidenav #drawer mode="side" opened class="!w-[280px] !border-r !border-slate-200 !bg-white !text-slate-900">
        <div class="flex h-full flex-col px-5 py-5">
          <div class="mb-6">
            <div class="portal-shell-strip mb-4"></div>
            <img
              class="hyland-logo hyland-logo-sidebar"
              src="https://hyland.atlassian.net/s/-s1g255/b/0/23f31f9f9a8155235832888b764f7e4e/_/jira-logo-scaled.png"
              alt="Hyland logo"
            />
            <p class="mt-3 text-base font-semibold text-slate-900">Admin Portal</p>
            <p class="mt-4 text-sm text-slate-600">Manage operations, publishing, policy rules, and communication controls in one workspace.</p>
          </div>

          <nav class="space-y-1 text-sm">
            <a *ngFor="let item of navItems"
               [routerLink]="item.link"
               routerLinkActive="bg-[#edf5ff] text-[#0f6cbd]"
               class="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-600 transition hover:bg-slate-50">
              <mat-icon class="!text-[20px]">{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          </nav>

          <div class="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p class="font-semibold text-slate-900">Specification-driven platform</p>
            <p class="mt-1">Manage published facilities, broadcasts, and operational telemetry with the same Hyland portal frame.</p>
          </div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="bg-transparent">
        <mat-toolbar class="!sticky !top-0 !z-30 !h-[76px] !bg-white/88 !px-4 !shadow-none md:!px-6">
          <button mat-icon-button class="md:!hidden" (click)="drawer.toggle()"><mat-icon>menu</mat-icon></button>

          <div class="portal-search hidden w-[340px] items-center gap-2 px-3 py-2 md:flex">
            <mat-icon class="!text-[20px] text-slate-500">search</mat-icon>
            <input class="w-full bg-transparent text-sm outline-none" placeholder="Search facilities, fields, and rules" />
          </div>

          <span class="flex-1"></span>

          <button
            mat-icon-button
            [matBadge]="pendingNotifications()"
            [matBadgeHidden]="pendingNotifications() === 0"
            matBadgeColor="warn"
            matBadgeSize="small"
            (click)="goNotifications()"
          ><mat-icon>notifications</mat-icon></button>

          <button mat-button [matMenuTriggerFor]="profileMenu" class="!ml-1 !rounded-full !border !border-slate-200 !bg-white !px-3">
            <mat-icon>account_circle</mat-icon>
            <span class="ml-1 hidden md:inline">{{ sessionService.state()?.user?.name || 'Admin' }}</span>
          </button>

          <mat-menu #profileMenu="matMenu">
            <button mat-menu-item (click)="goEmployeeView()"><mat-icon>dashboard</mat-icon><span>Employee Portal</span></button>
            <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Sign Out</span></button>
          </mat-menu>
        </mat-toolbar>

        <main class="p-4 md:p-6">
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
    { label: 'Reports', icon: 'bar_chart', link: '/admin/reports' },
    { label: 'Notifications', icon: 'notifications_active', link: '/admin/notifications' }
  ];
  readonly pendingNotifications = signal(0);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly adminApi: AdminApiService,
    public readonly sessionService: SessionService,
    private readonly authApi: AuthApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingNotifications();

    interval(20000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPendingNotifications(true));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goEmployeeView(): void {
    this.router.navigateByUrl('/employee/dashboard');
  }

  goNotifications(): void {
    this.router.navigateByUrl('/admin/notifications');
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

  private loadPendingNotifications(silent = false): void {
    this.adminApi.getNotificationOpsSummary().subscribe({
      next: (summary) => {
        this.pendingNotifications.set(summary.pending ?? 0);
      },
      error: () => {
        if (!silent) {
          this.pendingNotifications.set(0);
        }
      }
    });
  }
}
