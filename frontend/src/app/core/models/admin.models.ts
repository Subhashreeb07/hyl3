export interface AdminBookingSearchItem {
  bookingId: number;
  facilityId: number;
  facilityName: string;
  employeeId: string;
  status: string;
  bookingDate: string;
  createdAt: string;
  cancelledAt: string | null;
  qrCode: string | null;
}

export interface BookingSummaryResponse {
  facilityId: number;
  bookingDate: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
}

export interface OperationalSummaryResponse {
  bookingDate: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  cancellationRate: number;
  totalFacilities: number;
  publishedFacilities: number;
}

export interface FacilityUtilizationResponse {
  facilityId: number;
  facilityName: string;
  bookingDate: string;
  maximumCapacity: number | null;
  confirmedBookings: number;
  cancelledBookings: number;
  utilizationPercent: number;
}

export interface TrendPoint {
  bookingDate: string;
  confirmedBookings: number;
  cancelledBookings: number;
  totalBookings: number;
}

export interface BookingTrendResponse {
  fromDate: string;
  toDate: string;
  facilityId: number | null;
  points: TrendPoint[];
}

export interface ProcessNotificationsResponse {
  attempted: number;
  sent: number;
  retried: number;
  escalated: number;
  failed: number;
}

export interface NotificationOpsSummaryResponse {
  reportDate: string;
  total: number;
  pending: number;
  retrying: number;
  sent: number;
  failed: number;
  escalated: number;
}
