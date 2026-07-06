import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { EmployeeProfileResponse } from '../../core/models/employee-flow.models';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto max-w-6xl rounded-3xl bg-[#f7f5f3] p-5 shadow-lg md:p-7" *ngIf="profile() as p">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold text-[#111827]">Profile</h2>
        <a routerLink="/employee/dashboard" class="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-white">Home</a>
      </div>

      <div class="mt-4 rounded-2xl bg-white p-5">
        <p class="text-sm text-[#6b7280]">Employee ID</p>
        <p class="text-xl font-semibold text-[#111827]">{{ p.employeeId }}</p>
        <p class="mt-3 text-sm text-[#6b7280]">Name</p>
        <p class="text-xl font-semibold text-[#111827]">{{ p.employeeName }}</p>
        <p class="mt-3 text-sm text-[#6b7280]">Email</p>
        <p class="text-lg text-[#111827]">{{ p.email }}</p>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl bg-[#faf8f6] p-3">
            <p class="text-xs uppercase text-[#6b7280]">Department</p>
            <p class="font-semibold text-[#111827]">{{ p.department }}</p>
          </div>
          <div class="rounded-xl bg-[#faf8f6] p-3">
            <p class="text-xs uppercase text-[#6b7280]">Location</p>
            <p class="font-semibold text-[#111827]">{{ p.location }}</p>
          </div>
          <div class="rounded-xl bg-[#faf8f6] p-3">
            <p class="text-xs uppercase text-[#6b7280]">Total Bookings</p>
            <p class="font-semibold text-[#111827]">{{ p.totalBookings }}</p>
          </div>
          <div class="rounded-xl bg-[#faf8f6] p-3">
            <p class="text-xs uppercase text-[#6b7280]">Active Bookings</p>
            <p class="font-semibold text-[#111827]">{{ p.activeBookings }}</p>
          </div>
        </div>

        <button class="mt-5 rounded-xl bg-[#9a562d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#824923]" (click)="logout()">
          Logout
        </button>
      </div>
    </section>
  `
})
export class ProfileComponent implements OnInit {
  readonly profile = signal<EmployeeProfileResponse | null>(null);

  constructor(
    private readonly authApi: AuthApiService,
    private readonly employeeApi: EmployeeApiService,
    private readonly sessionService: SessionService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.employeeApi.getEmployeeProfile(employeeId).subscribe({
      next: (data) => this.profile.set(data),
      error: () => this.toastService.show('Unable to load profile', 'error')
    });
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
        this.toastService.show('Logged out successfully', 'success');
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.sessionService.clear();
        this.router.navigateByUrl('/login');
      }
    });
  }
}
