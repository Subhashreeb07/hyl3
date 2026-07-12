import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthApiService } from './core/services/auth-api.service';
import { SessionService } from './core/services/session.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <main class="min-h-screen">
      <section
        *ngIf="toastService.toast() as toast"
        class="mx-auto mb-4 max-w-md rounded-xl border px-4 py-3 text-sm shadow"
        [ngClass]="{
          'border-emerald-200 bg-emerald-50 text-emerald-800': toast.type === 'success',
          'border-rose-200 bg-rose-50 text-rose-800': toast.type === 'error',
          'border-blue-200 bg-blue-50 text-blue-800': toast.type === 'info'
        }"
      >
        {{ toast.message }}
      </section>

      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  constructor(
    readonly sessionService: SessionService,
    readonly toastService: ToastService,
    private readonly authApi: AuthApiService,
    private readonly router: Router
  ) {}

  logout(): void {
    const confirmation = window.confirm('Do you want to sign out of the current session?');
    if (!confirmation) {
      return;
    }

    const token = this.sessionService.getToken();
    if (!token) {
      this.sessionService.clear();
      this.router.navigateByUrl('/login');
      return;
    }

    this.authApi.logout(token).subscribe({
      next: () => {
        this.sessionService.clear();
        this.toastService.show('You have been signed out successfully.', 'success');
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.sessionService.clear();
        this.toastService.show('Your session has been cleared. Please sign in again.', 'info');
        this.router.navigateByUrl('/login');
      }
    });
  }
}
