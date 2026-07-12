import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthApiService } from '../../core/services/auth-api.service';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationStreamService } from '../../core/services/notification-stream.service';

@Component({
  selector: 'app-employee-portal-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatBadgeModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <div class="min-h-screen w-full bg-slate-50/30">
      <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="mx-auto max-w-[1320px] flex items-center justify-between h-16 px-5 md:px-8 gap-6">
          
          <!-- Left: Logo & Nav items -->
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-3">
              <img
                class="hyland-logo"
                src="https://hyland.atlassian.net/s/-s1g255/b/0/23f31f9f9a8155235832888b764f7e4e/_/jira-logo-scaled.png"
                alt="Hyland logo"
              />
              <div class="h-5 w-[1px] bg-slate-200 hidden md:block"></div>
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:block">Employee Portal</p>
            </div>
            
            <!-- Inline Nav for Desktop -->
            <nav class="hidden lg:flex items-center gap-1">
              <a *ngFor="let item of navItems"
                 [routerLink]="item.link"
                 routerLinkActive="text-slate-900 border-slate-900"
                 class="h-16 flex items-center px-3 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors border-b-2 border-transparent">
                {{ item.label }}
              </a>
            </nav>
          </div>

          <!-- Right: Search, Actions & Profile -->
          <div class="flex items-center gap-4">
            <label class="hidden md:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md bg-slate-50/50 w-52">
              <mat-icon class="!text-[18px] text-slate-400">search</mat-icon>
              <input class="bg-transparent text-xs outline-none text-slate-700 w-full" placeholder="Search bookings..." />
            </label>

            <button class="rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition" (click)="goDashboard()">Request Service</button>
            
            <button
              mat-icon-button
              class="!text-slate-500"
              [matBadge]="unreadNotifications()"
              [matBadgeHidden]="unreadNotifications() === 0"
              matBadgeColor="warn"
              matBadgeSize="small"
              (click)="openNotifications()"
            ><mat-icon class="!text-[22px]">notifications_none</mat-icon></button>

            <!-- Initials Avatar -->
            <button mat-button class="!min-w-0 !rounded-full !p-0" [matMenuTriggerFor]="profileMenu" aria-label="Open profile menu">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-200 transition">
                {{ initials() }}
              </div>
            </button>
          </div>
        </div>
        
        <!-- Mobile/Tablet Nav row -->
        <nav class="lg:hidden flex items-center gap-1 border-t border-slate-100 overflow-x-auto py-2 bg-white px-5 scrollbar-none">
          <a *ngFor="let item of navItems"
             [routerLink]="item.link"
             routerLinkActive="bg-slate-100 text-slate-900 font-semibold"
             class="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition whitespace-nowrap">
            {{ item.label }}
          </a>
        </nav>
      </header>

      <main class="mx-auto max-w-[1320px] px-5 py-6 md:px-8 md:py-8">
        <router-outlet></router-outlet>
      </main>

      <mat-menu #profileMenu="matMenu">
        <div class="px-4 py-2 border-b border-slate-100">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Welcome</p>
          <p class="text-sm font-bold text-slate-800 mt-0.5">{{ employeeDisplayName() }}</p>
          <p class="text-xs text-slate-500">Employee Account</p>
        </div>
        <button mat-menu-item (click)="goProfile()"><mat-icon>badge</mat-icon><span>Profile</span></button>
        <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Sign Out</span></button>
      </mat-menu>

      <!-- Notification Toaster -->
      <div class="fixed bottom-5 right-5 z-50 space-y-3 max-w-sm w-full">
        <div *ngFor="let toast of activeToasts()"
             class="flex items-center gap-3 p-4 rounded-lg bg-slate-900 text-white shadow-lg border border-slate-800 text-xs transition duration-300 animate-slide-in">
          <span class="text-emerald-400">🔔</span>
          <div class="flex-1">
            <p class="font-semibold">Notification Received</p>
            <p class="text-slate-300 mt-0.5">{{ toast.message }}</p>
          </div>
          <button class="text-slate-400 hover:text-white font-bold" (click)="dismissToast(toast.id)">✕</button>
        </div>
      </div>
    </div>
  `
})
export class EmployeePortalShellComponent implements OnInit, OnDestroy {
  readonly navItems = [
    { label: 'Overview', icon: 'dashboard', link: '/employee/dashboard' },
    { label: 'Notifications', icon: 'notifications', link: '/employee/notifications' },
    { label: 'Booking Records', icon: 'event_note', link: '/employee/history' },
    { label: 'Profile', icon: 'badge', link: '/employee/profile' }
  ];
  readonly unreadNotifications = signal(0);
  readonly activeToasts = signal<{ id: number; message: string; type: string }[]>([]);
  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly sessionService: SessionService,
    private readonly employeeApi: EmployeeApiService,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
    private readonly notificationStreamService: NotificationStreamService
  ) {}

  ngOnInit(): void {
    this.hydrateEmployeeIdentity();
    this.loadUnreadNotifications();

    const employeeId = this.sessionService.getEmployeeId();
    if (employeeId) {
      this.notificationStreamService.connect(employeeId);
    }

    this.notificationStreamService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.loadUnreadNotifications(true);
        if (notification && notification.messageBody) {
          this.addToast(notification.messageBody);
        }
      });
  }

  ngOnDestroy(): void {
    this.notificationStreamService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  addToast(message: string): void {
    const id = Date.now();
    this.activeToasts.update((t) => [...t, { id, message, type: 'info' }]);
    setTimeout(() => this.dismissToast(id), 5000);
  }

  dismissToast(id: number): void {
    this.activeToasts.update((t) => t.filter((x) => x.id !== id));
  }

  initials(): string {
    const name = this.sessionService.state()?.user?.name?.trim() ?? 'Employee';
    const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'E';
  }

  employeeDisplayName(): string {
    const name = this.sessionService.state()?.user?.name?.trim();
    if (!name) {
      return 'Employee';
    }
    return name;
  }

  goDashboard(): void {
    this.router.navigateByUrl('/employee/dashboard');
  }

  openNotifications(): void {
    this.router.navigateByUrl('/employee/notifications');
  }

  goProfile(): void {
    this.router.navigateByUrl('/employee/profile');
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

  private loadUnreadNotifications(silent = false): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) {
      this.unreadNotifications.set(0);
      return;
    }

    this.employeeApi.getEmployeeNotifications(employeeId).subscribe({
      next: (response) => {
        const unread = (response.items ?? []).filter((item) => {
          const status = (item.statusCode ?? '').toUpperCase();
          return status !== 'READ' && status !== 'CANCELLED';
        }).length;
        this.unreadNotifications.set(unread);
      },
      error: () => {
        if (!silent) {
          this.unreadNotifications.set(0);
        }
      }
    });
  }

  private hydrateEmployeeIdentity(): void {
    const employeeId = this.sessionService.getEmployeeId();
    const current = this.sessionService.state()?.user;
    if (!employeeId || !current) {
      return;
    }

    this.employeeApi.getEmployeeProfile(employeeId).subscribe({
      next: (profile) => {
        this.sessionService.refreshUser({
          employeeId: current.employeeId,
          name: profile.employeeName || current.name,
          email: profile.email || current.email,
          role: current.role
        });
      },
      error: () => {
        // Keep existing session identity if profile fetch fails.
      }
    });
  }
}