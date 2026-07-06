import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FacilityField, FacilityRules, FacilitySpecification } from '../../../core/models/specification.models';
import { FacilityAdminApiService } from '../../../core/services/facility-admin-api.service';
import { SpecificationApiService } from '../../../core/services/specification-api.service';

export type FacilityStatus = 'DRAFT' | 'PUBLISHED';

export interface FacilityBuilderRecord {
  id: number;
  facilityName: string;
  description: string;
  category: string;
  icon: string;
  colorTheme: string;
  status: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  fields: FacilityField[];
  rules: FacilityRules;
}

@Injectable({ providedIn: 'root' })
export class FacilityBuilderStateService {
  private idCounter = 3;

  readonly facilities = signal<FacilityBuilderRecord[]>([
    {
      id: 1,
      facilityName: 'Lunch',
      description: 'Daily lunch booking and meal preference capture',
      category: 'Food',
      icon: 'restaurant',
      colorTheme: '#0f6cbd',
      status: true,
      published: true,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      fields: [
        { label: 'Meal Type', fieldType: 'DROPDOWN', required: true, displayOrder: 1, options: ['Veg', 'Non-Veg'], placeholder: 'Select meal' },
        { label: 'Allergies', fieldType: 'TEXTAREA', required: false, displayOrder: 2, placeholder: 'Mention allergies' }
      ],
      rules: { bookingDeadline: '11:00', allowCancellation: true, qrRequired: false, weekendEnabled: false }
    },
    {
      id: 2,
      facilityName: 'Transport',
      description: 'Shuttle booking with pickup/drop configuration',
      category: 'Mobility',
      icon: 'directions_bus',
      colorTheme: '#107c10',
      status: true,
      published: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      fields: [
        { label: 'Pickup Point', fieldType: 'DROPDOWN', required: true, displayOrder: 1, options: ['Gate 1', 'Gate 2', 'Metro'] },
        { label: 'Shift Time', fieldType: 'TIME_PICKER', required: true, displayOrder: 2 }
      ],
      rules: { bookingDeadline: '17:00', allowCancellation: true, qrRequired: true, maximumCapacity: 60 }
    }
  ]);

  readonly activeFacilityId = signal<number | null>(null);
  readonly searchTerm = signal('');
  readonly loading = signal(false);

  readonly filteredFacilities = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.facilities();
    }

    return this.facilities().filter((f) =>
      [f.facilityName, f.category, f.description].join(' ').toLowerCase().includes(term)
    );
  });

  readonly activeFacility = computed(() => {
    const id = this.activeFacilityId();
    if (!id) {
      return null;
    }
    return this.facilities().find((f) => f.id === id) ?? null;
  });

  constructor(
    private readonly facilityAdminApi: FacilityAdminApiService,
    private readonly specificationApi: SpecificationApiService
  ) {}

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setActiveFacility(id: number | null): void {
    this.activeFacilityId.set(id);
  }

  async loadFromBackend(): Promise<void> {
    this.loading.set(true);
    try {
      const summaries = await firstValueFrom(this.facilityAdminApi.getFacilities());
      const records: FacilityBuilderRecord[] = [];

      for (const summary of summaries) {
        const detail = await firstValueFrom(this.facilityAdminApi.getFacility(summary.facilityId));
        const generated = await firstValueFrom(this.specificationApi.getGeneratedSpecification(summary.facilityId));
        const record = this.fromSpecification(generated as FacilitySpecification);

        record.id = detail.facilityId;
        record.facilityName = detail.facilityName;
        record.description = detail.description ?? '';
        record.category = detail.category ?? 'General';
        record.icon = detail.icon ?? 'inventory_2';
        record.status = detail.status;
        record.published = detail.published;
        records.push(record);
      }

      this.facilities.set(records);
      if (!this.activeFacilityId() && records.length > 0) {
        this.activeFacilityId.set(records[0].id);
      }
    } finally {
      this.loading.set(false);
    }
  }

  createDraft(): FacilityBuilderRecord {
    const record: FacilityBuilderRecord = {
      id: this.idCounter++,
      facilityName: 'Untitled Facility',
      description: '',
      category: 'General',
      icon: 'inventory_2',
      colorTheme: '#0f6cbd',
      status: true,
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: [],
      rules: {
        allowCancellation: true,
        qrRequired: false,
        weekendEnabled: false,
        holidayEnabled: false,
        regularCommuteEnabled: false
      }
    };

    this.facilities.update((items) => [record, ...items]);
    this.activeFacilityId.set(record.id);
    return record;
  }

  upsertFacility(record: FacilityBuilderRecord): void {
    const next = { ...record, updatedAt: new Date().toISOString() };
    this.facilities.update((items) => {
      const idx = items.findIndex((f) => f.id === record.id);
      if (idx < 0) {
        return [next, ...items];
      }
      const copy = [...items];
      copy[idx] = next;
      return copy;
    });
    this.activeFacilityId.set(next.id);
  }

  duplicateFacility(id: number): void {
    const source = this.facilities().find((f) => f.id === id);
    if (!source) {
      return;
    }

    const duplicate: FacilityBuilderRecord = {
      ...source,
      id: this.idCounter++,
      facilityName: `${source.facilityName} Copy`,
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: source.fields.map((field) => ({ ...field }))
    };

    this.facilities.update((items) => [duplicate, ...items]);
    this.activeFacilityId.set(duplicate.id);
  }

  deleteFacility(id: number): void {
    this.facilities.update((items) => items.filter((f) => f.id !== id));
    if (this.activeFacilityId() === id) {
      this.activeFacilityId.set(null);
    }
  }

  publishFacility(id: number): void {
    this.facilities.update((items) =>
      items.map((f) => (f.id === id ? { ...f, published: true, updatedAt: new Date().toISOString() } : f))
    );
  }

  toSpecification(record: FacilityBuilderRecord): FacilitySpecification {
    return {
      facilityId: record.id,
      facilityName: record.facilityName,
      description: record.description,
      category: record.category,
      icon: record.icon,
      status: record.status,
      published: record.published,
      fields: record.fields
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((field) => ({ ...field })),
      rules: { ...record.rules }
    };
  }

  fromSpecification(spec: FacilitySpecification): FacilityBuilderRecord {
    return {
      id: spec.facilityId ?? this.idCounter++,
      facilityName: spec.facilityName,
      description: spec.description ?? '',
      category: spec.category ?? 'General',
      icon: spec.icon ?? 'inventory_2',
      colorTheme: '#0f6cbd',
      status: spec.status ?? true,
      published: spec.published ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: (spec.fields ?? []).map((field, index) => ({
        ...field,
        displayOrder: field.displayOrder ?? index + 1
      })),
      rules: { ...(spec.rules ?? {}) }
    };
  }
}
