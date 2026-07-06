import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FacilityBuilderStateService } from '../state/facility-builder-state.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <article class="satori-card" *ngFor="let card of summaryCards()">
          <p class="text-xs uppercase tracking-[0.12em] text-slate-500">{{ card.label }}</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">{{ card.value }}</p>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <article class="satori-card">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Recent Activities</h2>
            <a routerLink="/admin/facilities" class="text-sm font-semibold text-[#0f6cbd]">View all</a>
          </div>
          <ul class="mt-4 space-y-3">
            <li *ngFor="let row of recentActivities" class="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p class="font-semibold text-slate-900">{{ row.title }}</p>
              <p>{{ row.subtitle }}</p>
            </li>
          </ul>
        </article>

        <article class="satori-card">
          <h2 class="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div class="mt-4 grid gap-3">
            <button class="satori-primary" (click)="createFacility()">Create Facility</button>
            <button class="satori-secondary" (click)="goBuilder()">Import JSON</button>
            <button class="satori-secondary" (click)="goReports()">View Reports</button>
          </div>

          <div class="mt-6 rounded-xl bg-[#f0f6ff] p-4">
            <p class="text-xs uppercase tracking-[0.12em] text-[#0f6cbd]">Recently Published</p>
            <ul class="mt-3 space-y-2 text-sm text-slate-700">
              <li *ngFor="let facility of recentlyPublished()">{{ facility.facilityName }} · {{ facility.updatedAt | date: 'mediumDate' }}</li>
            </ul>
          </div>
        </article>
      </section>
    </div>
  `
})
export class AdminDashboardPageComponent {
  readonly summaryCards = computed(() => {
    const facilities = this.state.facilities();
    const published = facilities.filter((f) => f.published).length;
    const draft = facilities.length - published;

    return [
      { label: 'Total Facilities', value: facilities.length },
      { label: 'Published Facilities', value: published },
      { label: 'Draft Facilities', value: draft },
      { label: "Today's Bookings", value: 164 },
      { label: "Today's Employees", value: 92 },
      { label: 'Pending Notifications', value: 11 }
    ];
  });

  readonly recentlyPublished = computed(() =>
    this.state
      .facilities()
      .filter((f) => f.published)
      .slice(0, 4)
  );

  readonly recentActivities = [
    { title: 'Lunch published', subtitle: 'Updated cutoff to 11:00 AM and republished.' },
    { title: 'Transport draft imported', subtitle: 'Team imported route schema from JSON.' },
    { title: 'Parking duplicated', subtitle: 'Created Parking Copy for Hyderabad annex office.' }
  ];

  constructor(
    private readonly state: FacilityBuilderStateService,
    private readonly router: Router
  ) {}

  createFacility(): void {
    this.state.createDraft();
    this.router.navigateByUrl('/admin/form-builder');
  }

  goBuilder(): void {
    this.router.navigateByUrl('/admin/form-builder');
  }

  goReports(): void {
    this.router.navigateByUrl('/admin/reports');
  }
}
