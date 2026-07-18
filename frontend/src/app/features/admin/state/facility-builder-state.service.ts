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
  facilityType: 'FACILITY' | 'EVENT';
  colorTheme: string;
  status: boolean;
  published: boolean;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  fields: FacilityField[];
  rules: FacilityRules;
  isLocal?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FacilityBuilderStateService {
  private idCounter = 1;

  readonly facilities = signal<FacilityBuilderRecord[]>([]);

  readonly activeFacilityId = signal<number | null>(null);
  readonly searchTerm = signal('');
  readonly loading = signal(false);

  readonly filteredFacilities = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const visible = this.facilities().filter(f => !f.isLocal);
    
    if (!term) {
      return visible;
    }

    return visible.filter((f) => {
      const basicMatch = [f.facilityName, f.category, f.description].join(' ').toLowerCase().includes(term);
      if (basicMatch) return true;
      
      const fieldsMatch = f.fields?.some(field => field.label?.toLowerCase().includes(term) || field.fieldType?.toLowerCase().includes(term));
      if (fieldsMatch) return true;
      
      return false;
    });
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
        let generated: FacilitySpecification | null = null;

        try {
          generated = await firstValueFrom(this.specificationApi.getGeneratedSpecification(summary.facilityId));
        } catch {
          generated = null;
        }

        const record = generated
          ? this.fromSpecification(generated)
          : this.fromSpecification({
              facilityId: detail.facilityId,
              facilityName: detail.facilityName,
              description: detail.description,
              category: detail.category,
              icon: detail.icon,
              facilityType: detail.facilityType,
              status: detail.status,
              published: detail.published,
              fields: [],
              rules: {}
            });

        // Also fetch full rules (includes rules_json fields like reminderTime, availableDays, etc.)
        try {
          const fullRules = await firstValueFrom(this.facilityAdminApi.getRules(summary.facilityId));
          if (fullRules) {
            record.rules = { ...(record.rules ?? {}), ...fullRules };
          }
        } catch {
          // Rules may not exist yet — keep what we have from the spec
        }

        record.id = detail.facilityId;
        record.facilityName = detail.facilityName;
        record.description = detail.description ?? '';
        record.category = detail.category ?? 'General';
        record.icon = detail.icon ?? 'inventory_2';
        record.facilityType = detail.facilityType ?? 'FACILITY';
        record.status = detail.status;
        record.published = detail.published;
        record.isTemplate = detail.isTemplate ?? false;
        record.isPublic = detail.isPublic ?? true;
        records.push(record);
      }

      this.facilities.set(records);
      const maxId = records.reduce((max, item) => Math.max(max, item.id), 0);
      this.idCounter = maxId + 1;
      if (!this.activeFacilityId() && records.length > 0) {
        this.activeFacilityId.set(records[0].id);
      } else if (records.length === 0) {
        this.activeFacilityId.set(null);
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
      facilityType: 'FACILITY',
      colorTheme: '#0f6cbd',
      status: true,
      published: false,
      isTemplate: false,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: [],
      rules: {
        employeeTypes: ['On-site', 'Remote', 'Hybrid'],
        roles: ['HR', 'Manager', 'Finance', 'Cloud', 'RD', 'Director', 'IS', 'NOC', 'Ops', 'Devops'],
      },
      isLocal: true
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

  async createFromTemplate(templateId: number): Promise<FacilityBuilderRecord> {
    const resp = await firstValueFrom(this.facilityAdminApi.createFromTemplate(templateId));
    const detail = await firstValueFrom(this.facilityAdminApi.getFacility(resp.facilityId));

    let generated: FacilitySpecification | null = null;
    try {
      generated = await firstValueFrom(this.specificationApi.getGeneratedSpecification(resp.facilityId));
    } catch {
      generated = null;
    }

    const record = generated
      ? this.fromSpecification(generated)
      : this.fromSpecification({
          facilityId: detail.facilityId,
          facilityName: detail.facilityName,
          description: detail.description,
          category: detail.category,
          icon: detail.icon,
          facilityType: detail.facilityType,
          status: detail.status,
          published: detail.published,
          fields: [],
          rules: {}
        });

    record.id = detail.facilityId;
    record.facilityName = detail.facilityName;
    record.description = detail.description ?? '';
    record.category = detail.category ?? 'General';
    record.icon = detail.icon ?? 'inventory_2';
    record.facilityType = detail.facilityType ?? 'FACILITY';
    record.status = detail.status;
    record.published = detail.published;
    record.isTemplate = false;
    record.isPublic = detail.isPublic ?? true;

    this.facilities.update((items) => [record, ...items]);
    this.activeFacilityId.set(record.id);
    return record;
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
      isTemplate: false,
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

  async saveAsTemplate(id: number): Promise<void> {
    await firstValueFrom(this.facilityAdminApi.saveAsTemplate(id));
    this.facilities.update((items) =>
      items.map((f) => (f.id === id ? { ...f, isTemplate: true, published: false } : f))
    );
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
      facilityType: record.facilityType,
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
    const nestedFacility = (spec as any)?.facility ?? {};
    return {
      id: spec.facilityId ?? nestedFacility.facilityId ?? this.idCounter++,
      facilityName: spec.facilityName ?? nestedFacility.facilityName,
      description: spec.description ?? nestedFacility.description ?? '',
      category: spec.category ?? nestedFacility.category ?? 'General',
      icon: spec.icon ?? nestedFacility.icon ?? 'inventory_2',
      facilityType: (spec.facilityType ?? nestedFacility.facilityType ?? 'FACILITY'),
      colorTheme: '#0f6cbd',
      status: spec.status ?? true,
      published: spec.published ?? false,
      isTemplate: (spec as any).isTemplate ?? false,
      isPublic: (spec as any).isPublic ?? true,
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
