export type ShippingStatus =
  | 'unfulfilled'
  | 'manifested'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rto';

export interface TrackingCheckpoint {
  timestamp: string;
  location: string;
  status: string;
  activity: string;
}

export interface ShipmentTrackingDTO {
  orderNumber: string;
  shippingStatus: ShippingStatus;
  courierName?: string;
  awbCode?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  destinationCity?: string;
  destinationState?: string;
  checkpoints: TrackingCheckpoint[];
}

export interface CreateShipmentInput {
  orderId: string;
  pickupLocation?: string;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  weightKg?: number;
}

export interface ShipmentDetailsDTO {
  id: string;
  orderId: string;
  orderNumber: string;
  shippingProvider: string;
  shipmentId: string;
  shiprocketOrderId?: string;
  awbCode?: string;
  courierName?: string;
  shippingStatus: ShippingStatus;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
}
