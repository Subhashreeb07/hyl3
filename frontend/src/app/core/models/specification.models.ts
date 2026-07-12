export type FieldType =
  | 'TEXTBOX'
  | 'TEXTAREA'
  | 'DROPDOWN'
  | 'RADIO_BUTTON'
  | 'CHECKBOX'
  | 'DATE_PICKER'
  | 'TIME_PICKER'
  | 'EMAIL'
  | 'SIGNATURE'
  | 'NUMBER'
  | 'PHONE'
  | 'QR_SCANNER'
  | 'FILE_UPLOAD';

export interface FacilityFieldOption {
  value: string;
}

export interface FacilityField {
  fieldId?: number;
  label: string;
  fieldType: FieldType;
  placeholder?: string;
  required: boolean;
  displayOrder: number;
  helpText?: string;
  defaultValue?: string;
  validationJson?: string;
  conditionalVisibility?: string;
  options?: string[];
}

export interface FacilityRules {
  facilityAvailableFromDate?: string | null;
  facilityAvailableToDate?: string | null;
  bookingStartTime?: string | null;
  bookingEndTime?: string | null;
  bookingDeadline?: string | null;
  cancellationDeadline?: string | null;
  bookingWindow?: string | null;
  bookingWindowDays?: number | null;
  availableDays?: string | null;
  reminderTime?: string | null;
  maximumCapacity?: number | null;
  qrRequired?: boolean;
  approvalRequired?: boolean;
  allowCancellation?: boolean;
  autoCloseFacility?: boolean;
  weekendEnabled?: boolean;
  holidayEnabled?: boolean;
  regularCommuteEnabled?: boolean;
}

export interface FacilitySpecification {
  facilityId?: number;
  facilityName: string;
  description?: string;
  category?: string;
  icon?: string;
  status?: boolean;
  published?: boolean;
  fields: FacilityField[];
  rules?: FacilityRules;
}
