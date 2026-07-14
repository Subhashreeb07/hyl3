import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal, HostListener } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  template: `
    <mat-sidenav-container autosize class="h-screen w-screen overflow-hidden" style="background:#F4F6F9;">
      <!-- ── Sidebar ── -->
      <mat-sidenav #drawer [mode]="isMobile() ? 'over' : 'side'" 
                   [opened]="isMobile() ? !isCollapsed() : true"
                   (closedStart)="isMobile() && isCollapsed.set(true)"
                   style="background:#ffffff;border-right:1px solid #E2E8F0;"
                   class="transition-all duration-300 ease-in-out"
                   [style.width]="(!isMobile() && isCollapsed()) ? '0px' : '272px'"
                   [style.visibility]="(!isMobile() && isCollapsed()) ? 'hidden' : 'visible'"
                   [style.border-right]="(!isMobile() && isCollapsed()) ? 'none' : '1px solid #E2E8F0'">
        <div class="flex h-full flex-col overflow-hidden" style="padding:1.25rem 1rem;">

          <!-- Tricolor accent strip -->
          <div style="height:3px;border-radius:2px;background:linear-gradient(90deg,#fff 0% 34%,#14B8A6 34% 68%,#F59E0B 68% 100%);margin-bottom:1.25rem;"></div>

          <!-- Logo + collapse -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
            <img
              class="hyland-logo hyland-logo-sidebar"
              src="https://www.keymarkinc.com/wp-content/uploads/2025/05/Hyland-logos_CMYK-scaled.png"
              alt="Hyland logo"
              style="width: 140px; height: auto;"
            />
            <button type="button"
                    (click)="toggleSidebar()"
                    style="width:28px;height:28px;border-radius:6px;background:#F1F5F9;border:1px solid #E2E8F0;color:#64748B;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;"
                    onmouseenter="this.style.background='#E2E8F0';this.style.color='#0A1628'"
                    onmouseleave="this.style.background='#F1F5F9';this.style.color='#64748B'"
                    title="Collapse sidebar">
              <mat-icon class="!text-[18px]">chevron_left</mat-icon>
            </button>
          </div>

          <!-- Portal title -->
          <div style="margin-bottom:1.5rem;padding:0 0.25rem;">
            <p style="font-size:0.88rem;font-weight:700;color:#0A1628;letter-spacing:-0.01em;">Employee Portal</p>
            <p style="font-size:0.7rem;color:#64748B;margin-top:0.2rem;line-height:1.4;">Book services, manage schedules, and stay updated.</p>
          </div>

          <!-- Nav section label -->
          <p style="font-size:0.58rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#94A3B8;margin-bottom:0.5rem;padding:0 0.5rem;">Navigation</p>

          <!-- Nav Items -->
          <nav style="display:flex;flex-direction:column;gap:0.5rem;">
            <a *ngFor="let item of navItems"
               [routerLink]="item.link"
               routerLinkActive="active-nav"
               (click)="onNavClick()"
               style="display:flex;align-items:center;gap:0.8rem;border-radius:8px;padding:0.75rem 1rem;color:#64748B;font-size:0.9rem;font-weight:600;text-decoration:none;transition:all 0.15s;position:relative;"
               onmouseenter="if(!this.classList.contains('active-nav')){this.style.background='#F8FAFC';this.style.color='#0A1628';}"
               onmouseleave="if(!this.classList.contains('active-nav')){this.style.background='transparent';this.style.color='#64748B';}">
              <mat-icon style="font-size:22px;width:22px;height:22px;flex-shrink:0;">{{ item.icon }}</mat-icon>
              <span style="font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ item.label }}</span>
            </a>
          </nav>

          <!-- Notification badge -->
          <div *ngIf="unreadNotifications() > 0"
               style="margin-top:0.75rem;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:0.65rem 0.75rem;display:flex;align-items:center;gap:0.5rem;cursor:pointer;"
               (click)="openNotifications()">
            <span style="width:8px;height:8px;border-radius:50%;background:#EF4444;flex-shrink:0;"></span>
            <p style="font-size:0.72rem;font-weight:600;color:#991B1B;margin:0;">{{ unreadNotifications() }} unread notification{{ unreadNotifications() === 1 ? '' : 's' }}</p>
          </div>
        </div>
      </mat-sidenav>

      <!-- ── Main Content ── -->
      <mat-sidenav-content style="background:#F4F6F9;display:flex;flex-direction:column;height:100vh;">
        <!-- Toolbar -->
        <mat-toolbar style="background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid #E2E8F0;height:64px;padding:0 1.5rem;flex-shrink:0;position:sticky;top:0;z-index:30;box-shadow:0 1px 4px rgba(0,0,0,0.04);">

          <!-- Open Sidebar (when collapsed or mobile) -->
          <button type="button"
                  *ngIf="isCollapsed() || isMobile()"
                  (click)="toggleSidebar()"
                  style="width:36px;height:36px;border-radius:8px;border:1.5px solid #E2E8F0;background:#fff;color:#64748B;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-right:1rem;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.05);flex-shrink:0;"
                  matTooltip="Open sidebar">
            <mat-icon style="font-size:20px;">menu</mat-icon>
          </button>

          <!-- Search bar -->
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 border border-slate-200"
               style="width:340px; background: #F8FAFC; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);"
               [class.ml-2]="isCollapsed()"
               onfocusin="this.style.background='#fff'; this.style.borderColor='#93C5FD'; this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'"
               onfocusout="this.style.background='#F8FAFC'; this.style.borderColor='#E2E8F0'; this.style.boxShadow='inset 0 1px 2px rgba(0,0,0,0.02)'">
            <mat-icon style="font-size:18px; width:18px; height:18px; color:#64748B;">search</mat-icon>
            <input class="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-slate-400"
                   style="color:#0A1628; font-family:inherit;"
                   placeholder="Search bookings, facilities, or dates..." />
            <div class="flex items-center justify-center rounded border border-slate-200 bg-white px-1.5 py-0.5" style="box-shadow:0 1px 2px rgba(0,0,0,0.04); flex-shrink:0;">
              <span class="text-[10px] font-bold text-slate-400">Ctrl K</span>
            </div>
          </div>

          <span class="flex-1"></span>

          <!-- Right actions -->
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <!-- Notifications -->
            <button mat-icon-button
                    [matBadge]="unreadNotifications()"
                    [matBadgeHidden]="unreadNotifications() === 0"
                    matBadgeColor="warn"
                    matBadgeSize="small"
                    (click)="openNotifications()"
                    style="color:#64748B;">
              <mat-icon style="font-size:22px;">notifications_none</mat-icon>
            </button>

            <!-- Separator -->
            <div style="width:1px;height:22px;background:#E2E8F0;margin:0 4px;"></div>

            <!-- Avatar -->
            <button mat-button class="!min-w-0 !p-0 !rounded-full" [matMenuTriggerFor]="profileMenu" aria-label="Open profile menu">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0A1628,#1E4D8C);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:#fff;letter-spacing:0.02em;flex-shrink:0;">
                {{ initials() }}
              </div>
            </button>
          </div>
        </mat-toolbar>

        <!-- Page content -->
        <main style="flex:1;overflow-y:auto;">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>

      <!-- Profile dropdown menu -->
      <mat-menu #profileMenu="matMenu">
        <div style="padding:0.75rem 1rem;border-bottom:1px solid #F1F5F9;">
          <p style="font-size:0.62rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 0.2rem;">Signed in as</p>
          <p style="font-size:0.875rem;font-weight:700;color:#0A1628;margin:0;">{{ employeeDisplayName() }}</p>
          <p style="font-size:0.72rem;color:#64748B;margin:0;">Employee Account</p>
        </div>
        <button mat-menu-item (click)="goProfile()"><mat-icon>badge</mat-icon><span>My Profile</span></button>
        <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon><span>Sign Out</span></button>
      </mat-menu>

      <!-- Notification Toaster -->
      <div style="position:fixed;bottom:1.25rem;right:1.25rem;z-index:9999;display:flex;flex-direction:column;gap:0.75rem;max-width:340px;width:100%;">
        <div *ngFor="let toast of activeToasts()"
             style="display:flex;align-items:center;gap:0.75rem;padding:1rem 1.1rem;border-radius:12px;background:#0A1628;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);font-size:0.78rem;"
             class="animate-slide-in">
          <mat-icon style="color:#14B8A6;font-size:18px;flex-shrink:0;">notifications_active</mat-icon>
          <div style="flex:1;min-width:0;">
            <p style="font-weight:700;margin:0;font-size:0.78rem;">Notification</p>
            <p style="color:rgba(255,255,255,0.6);margin:0;margin-top:1px;font-size:0.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ toast.message }}</p>
          </div>
          <button style="background:transparent;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:0.9rem;padding:0;line-height:1;transition:color 0.15s;"
                  onmouseenter="this.style.color='#fff'"
                  onmouseleave="this.style.color='rgba(255,255,255,0.4)'"
                  (click)="dismissToast(toast.id)">✕</button>
        </div>
      </div>
    </mat-sidenav-container>
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
  readonly isCollapsed = signal(false);
  readonly isMobile = signal(false);
  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly sessionService: SessionService,
    private readonly employeeApi: EmployeeApiService,
    private readonly authApi: AuthApiService,
    private readonly router: Router,
    private readonly notificationStreamService: NotificationStreamService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    this.isMobile.set(mobile);
    if (mobile) {
      this.isCollapsed.set(true); // default closed on mobile
    }
  }

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

  toggleSidebar(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.isCollapsed.set(true);
    }
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