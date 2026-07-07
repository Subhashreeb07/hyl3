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
    <section class="mx-auto max-w-6xl p-2 md:p-6">
      <div class="mx-auto grid max-w-xl gap-6 rounded-3xl bg-[#f7f5f3] p-5 shadow-lg md:p-8">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ece7e3] text-xl">🏢</div>
        <div class="text-center">
          <h2 class="text-4xl font-bold leading-tight text-[#1f2937] md:text-5xl">Workplace Hub</h2>
          <p class="mt-2 text-sm text-[#6b7280]">Secure enterprise access for the global workforce environment.</p>
        </div>

        <div class="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <form [formGroup]="form" (ngSubmit)="signInWithSso()" class="grid gap-3">
            <label class="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c5a45]">Employee ID</label>
            <input
              formControlName="employeeId"
              class="rounded-xl border border-[#ece6e0] bg-[#f7f5f3] px-4 py-3 text-sm text-[#374151] outline-none ring-[#d39c78] focus:ring"
              placeholder="Your Employee ID"
            />
            <label class="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c5a45]">Password</label>
            <input
              type="password"
              formControlName="password"
              class="rounded-xl border border-[#ece6e0] bg-[#f7f5f3] px-4 py-3 text-sm text-[#374151] outline-none ring-[#d39c78] focus:ring"
              placeholder="Your Password"
            />
            <button type="submit" class="mt-1 w-full rounded-xl bg-[#9a562d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#824923]">Sign In</button>
          </form>
          <p *ngIf="error()" class="mt-2 text-sm font-medium text-rose-700">{{ error() }}</p>
        </div>

        <div class="overflow-hidden rounded-2xl bg-[#ede8e2]">
          <div class="h-48 bg-[linear-gradient(120deg,#d7c5b6_0%,#efebe7_45%,#d3ccc4_100%)]"></div>
        </div>

        <p class="text-center text-sm font-semibold text-[#374151]">ⓘ Need help signing in?</p>
      </div>
    </section>
  `
})
export class LoginComponent {
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    employeeId: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authApi: AuthApiService,
    private readonly sessionService: SessionService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  signInWithSso(): void {
    this.error.set(null);
    const employeeId = (document.querySelector('input[placeholder="Employee ID"]') as HTMLInputElement)?.value ?? '';
    const password = (document.querySelector('input[placeholder="Password"]') as HTMLInputElement)?.value ?? '';
    
    if (!employeeId.trim() || !password.trim()) {
      this.toastService.show('Please enter employee ID and password', 'error');
      return;
    }
    
    this.doLogin(employeeId, password);
  }

  private doLogin(employeeId: string, password: string): void {
    const payload = { employeeId, password };
    this.authApi.login(payload).subscribe({
      next: (response) => {
        this.sessionService.setFromLogin(response);
        this.toastService.show(`Welcome ${response.name}`, 'success');
        if ((response.role ?? '').toUpperCase() === 'ADMIN') {
          this.router.navigateByUrl('/admin/dashboard');
        } else {
          this.router.navigateByUrl('/employee/dashboard');
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Login failed');
        this.toastService.show(this.error() ?? 'Login failed', 'error');
      }
    });
  }
}
