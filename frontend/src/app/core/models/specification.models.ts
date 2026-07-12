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
  | 'FILE_UPLOAD'
  | 'TREE_SELECT';

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
  bookingStartTime?: string | null;
  bookingDeadline?: string | null;
  employeeTypes?: string[] | null;
  roles?: string[] | null;
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
