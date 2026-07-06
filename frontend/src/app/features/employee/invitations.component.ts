import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InvitationsResponse } from '../../core/models/employee-flow.models';
import { EmployeeApiService } from '../../core/services/employee-api.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-employee-invitations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="mx-auto max-w-6xl rounded-3xl bg-[#f7f5f3] p-5 shadow-lg md:p-7" *ngIf="data() as view">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold text-[#111827]">Invitations</h2>
        <a routerLink="/employee/dashboard" class="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-white">Home</a>
      </div>
      <p class="mt-2 text-sm text-[#6b7280]">Pending: {{ view.pendingCount }}</p>

      <div class="mt-4 grid gap-3">
        <article *ngFor="let invitation of view.invitations" class="rounded-2xl bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-xl font-semibold text-[#111827]">{{ invitation.title }}</h3>
              <p class="mt-1 text-sm text-[#6b7280]">{{ invitation.schedule }} · {{ invitation.location }}</p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-semibold"
              [ngClass]="invitation.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'">
              {{ invitation.status }}
            </span>
          </div>
        </article>
      </div>
    </section>
  `
})
export class InvitationsComponent implements OnInit {
  readonly data = signal<InvitationsResponse | null>(null);

  constructor(
    private readonly employeeApi: EmployeeApiService,
    private readonly sessionService: SessionService
  ) {}

  ngOnInit(): void {
    const employeeId = this.sessionService.getEmployeeId();
    if (!employeeId) {
      return;
    }

    this.employeeApi.getEmployeeInvitations(employeeId).subscribe({
      next: (result) => this.data.set(result),
      error: () => this.data.set({ employeeId, pendingCount: 0, invitations: [] })
    });
  }
}
