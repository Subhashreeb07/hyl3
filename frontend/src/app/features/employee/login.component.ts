import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f6fa] px-4 py-8">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(12,71,138,0.10),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.08),_transparent_45%)]"></div>

      <div class="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#dbe5ef] bg-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.6)] lg:grid-cols-2">
        <aside class="hidden bg-gradient-to-br from-[#0b2948] via-[#103b63] to-[#0f2239] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <img
              class="hyland-logo"
              src="https://www.keymarkinc.com/wp-content/uploads/2025/05/Hyland-logos_CMYK-scaled.png"
              alt="Hyland logo"
              style="width: 140px; height: auto;"
            />
            <p class="mt-8 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
              Enterprise Access
            </p>
            <h1 class="mt-4 text-3xl font-semibold leading-tight">Secure sign-in for your Hyland workspace</h1>
            <p class="mt-4 max-w-sm text-sm leading-6 text-slate-200">
              Access employee tools, booking workflows, and internal operations through a protected enterprise portal.
            </p>
          </div>
          <p class="text-xs text-slate-300">Authorized employees only. Activity may be monitored for security and compliance.</p>
        </aside>

        <div class="p-6 sm:p-8 lg:p-10">
          <div class="mb-8 lg:hidden">
            <img
              class="hyland-logo"
              src="https://www.keymarkinc.com/wp-content/uploads/2025/05/Hyland-logos_CMYK-scaled.png"
              alt="Hyland logo"
              style="width: 130px; height: auto;"
            />
            <h1 class="mt-4 text-2xl font-semibold text-[#0f172a]">Employee access portal</h1>
            <p class="mt-1 text-sm text-slate-600">Sign in with your corporate credentials.</p>
          </div>

          <div class="mb-5 grid grid-cols-2 rounded-xl bg-[#f1f5f9] p-1">
            <button
              type="button"
              class="rounded-lg px-3 py-2.5 text-sm font-semibold transition"
              [ngClass]="mode() === 'SIGN_IN' ? 'bg-white text-[#0f3358] shadow-sm' : 'text-[#475569]'"
              (click)="setMode('SIGN_IN')"
            >
              Sign In
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-2.5 text-sm font-semibold transition"
              [ngClass]="mode() === 'SIGN_UP' ? 'bg-white text-[#0f3358] shadow-sm' : 'text-[#475569]'"
              (click)="setMode('SIGN_UP')"
            >
              Sign Up
            </button>
          </div>

          <form [formGroup]="mode() === 'SIGN_IN' ? loginForm : registerForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div *ngIf="mode() === 'SIGN_UP'">
            <label for="name" class="block text-xs font-semibold uppercase tracking-wider text-[#475569]">Full Name</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              [class.border-red-500]="isFieldInvalid('name')"
              class="mt-2 w-full rounded-lg border border-[#dbe3ed] bg-white px-4 py-3 text-sm text-[#0f172a] transition placeholder-[#94a3b8] focus:border-[#1d4f82] focus:outline-none focus:ring-4 focus:ring-[#1d4f82]/10"
              placeholder="Enter your legal full name"
              [disabled]="isLoading()"
            />
          </div>

          <div>
            <label for="employeeId" class="block text-xs font-semibold uppercase tracking-wider text-[#475569]">Employee ID</label>
            <input
              id="employeeId"
              type="text"
              formControlName="employeeId"
              [class.border-red-500]="isFieldInvalid('employeeId')"
              class="mt-2 w-full rounded-lg border border-[#dbe3ed] bg-white px-4 py-3 text-sm text-[#0f172a] transition placeholder-[#94a3b8] focus:border-[#1d4f82] focus:outline-none focus:ring-4 focus:ring-[#1d4f82]/10"
              placeholder="Enter your corporate employee ID"
              [disabled]="isLoading()"
            />
          </div>

          <div *ngIf="mode() === 'SIGN_UP'">
            <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-[#475569]">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              [class.border-red-500]="isFieldInvalid('email')"
              class="mt-2 w-full rounded-lg border border-[#dbe3ed] bg-white px-4 py-3 text-sm text-[#0f172a] transition placeholder-[#94a3b8] focus:border-[#1d4f82] focus:outline-none focus:ring-4 focus:ring-[#1d4f82]/10"
              placeholder="Enter your corporate email address"
              [disabled]="isLoading()"
            />
          </div>

          <div *ngIf="mode() === 'SIGN_UP'" class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label for="department" class="block text-xs font-semibold uppercase tracking-wider text-[#475569]">Department</label>
              <input
                id="department"
                type="text"
                formControlName="department"
                class="mt-2 w-full rounded-lg border border-[#dbe3ed] bg-white px-4 py-3 text-sm text-[#0f172a] transition placeholder-[#94a3b8] focus:border-[#1d4f82] focus:outline-none focus:ring-4 focus:ring-[#1d4f82]/10"
                placeholder="Enter your department"
                [disabled]="isLoading()"
              />
            </div>
            <div>
              <label for="officeLocation" class="block text-xs font-semibold uppercase tracking-wider text-[#475569]">Office</label>
              <select
                id="officeLocation"
                formControlName="officeLocation"
                class="mt-2 w-full rounded-lg border border-[#dbe3ed] bg-white px-4 py-3 text-sm text-[#0f172a] focus:border-[#1d4f82] focus:outline-none focus:ring-4 focus:ring-[#1d4f82]/10"
                [disabled]="isLoading()"
              >
                <option value="HYDERABAD">Hyderabad</option>
                <option value="KOLKATA">Kolkata</option>
              </select>
            </div>
          </div>

          <div>
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-[#475569]">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              [class.border-red-500]="isFieldInvalid('password')"
              class="mt-2 w-full rounded-lg border border-[#dbe3ed] bg-white px-4 py-3 text-sm text-[#0f172a] transition placeholder-[#94a3b8] focus:border-[#1d4f82] focus:outline-none focus:ring-4 focus:ring-[#1d4f82]/10"
              [placeholder]="mode() === 'SIGN_IN' ? 'Enter your password' : 'Create a secure password'"
              [disabled]="isLoading()"
            />
          </div>

          <!-- Error Message -->
          <div
            *ngIf="error()"
            class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            <div class="font-medium">Authentication Unsuccessful</div>
            <div class="text-xs mt-1">{{ error() }}</div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="(mode() === 'SIGN_IN' ? loginForm.invalid : registerForm.invalid) || isLoading()"
            class="relative mt-6 w-full rounded-lg bg-gradient-to-r from-[#154777] to-[#0f3358] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 hover:enabled:from-[#123d67] hover:enabled:to-[#0d2d4f] active:enabled:scale-95"
          >
            <span *ngIf="!isLoading()" class="flex items-center justify-center gap-2">
              <span>{{ mode() === 'SIGN_IN' ? 'Sign In' : 'Create Account' }}</span>
            </span>
            <span *ngIf="isLoading()" class="flex items-center justify-center gap-2">
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2" stroke-opacity="0.2"></circle>
                <path d="M12 2a10 10 0 0110 10" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <span>{{ mode() === 'SIGN_IN' ? 'Signing in...' : 'Creating account...' }}</span>
            </span>
          </button>
        </form>

          <p class="mt-6 text-center text-xs text-slate-500">Hyland employee systems access.</p>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  readonly error = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly mode = signal<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  readonly loginForm = this.fb.group({
    employeeId: ['', [Validators.required, Validators.minLength(1)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly registerForm = this.fb.group({
    employeeId: ['', [Validators.required, Validators.minLength(1)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    department: [''],
    officeLocation: ['HYDERABAD', [Validators.required]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authApi: AuthApiService,
    private readonly sessionService: SessionService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  isFieldInvalid(fieldName: string): boolean {
    const field = this.mode() === 'SIGN_IN'
      ? this.loginForm.get(fieldName)
      : this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    this.error.set(null);

    if (this.mode() === 'SIGN_IN') {
      this.submitSignIn();
      return;
    }

    this.submitSignUp();
  }

  setMode(mode: 'SIGN_IN' | 'SIGN_UP'): void {
    if (this.mode() === mode) {
      return;
    }

    this.mode.set(mode);
    this.error.set(null);
  }

  private submitSignIn(): void {
    if (this.loginForm.invalid) {
      this.toastService.show('Please complete all required fields.', 'error');
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    const employeeId = (this.loginForm.value.employeeId ?? '').trim().toUpperCase();
    const password = (this.loginForm.value.password ?? '').trim();

    this.doLogin(employeeId, password);
  }

  private submitSignUp(): void {
    if (this.registerForm.invalid) {
      this.toastService.show('Please complete all required registration fields.', 'error');
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);

    const payload = {
      employeeId: (this.registerForm.value.employeeId ?? '').trim().toUpperCase(),
      name: (this.registerForm.value.name ?? '').trim(),
      email: (this.registerForm.value.email ?? '').trim().toLowerCase(),
      password: (this.registerForm.value.password ?? '').trim(),
      department: (this.registerForm.value.department ?? '').trim() || undefined,
      officeLocation: (this.registerForm.value.officeLocation ?? 'HYDERABAD').trim().toUpperCase()
    };

    this.authApi.register(payload).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.sessionService.setFromLogin(response);
        this.toastService.show(`Welcome, ${response.name}. Your account has been provisioned successfully.`, 'success');
        this.registerForm.reset({ officeLocation: 'HYDERABAD' });
        this.router.navigateByUrl('/employee/dashboard');
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err?.error?.message ?? 'Account provisioning was unsuccessful. Please try again.';
        this.error.set(message);
        this.toastService.show(message, 'error');
      }
    });
  }

  private doLogin(employeeId: string, password: string): void {
    this.isLoading.set(true);
    const payload = { employeeId, password };

    this.authApi.login(payload).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.sessionService.setFromLogin(response);
        this.toastService.show(`Welcome, ${response.name}.`, 'success');
        this.loginForm.reset();

        const dashboard = (response.role ?? '').toUpperCase() === 'ADMIN'
          ? '/admin/dashboard'
          : '/employee/dashboard';
        this.router.navigateByUrl(dashboard);
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err?.error?.message ?? 'Authentication failed. Please verify your credentials and try again.';
        this.error.set(message);
        this.toastService.show(message, 'error');
      }
    });
  }
}
