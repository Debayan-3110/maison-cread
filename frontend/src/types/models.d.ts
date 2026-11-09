export interface User {
  id: number;
  email: string;
  name?: string;
  fullName?: string;
  phone?: string;
  phoneVerified?: boolean;
  authProvider?: string;
  address: string;
  avatar: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  thumbnail: string;
  images?: string[];
  rating: number;
  stock: number;
  brand: string;
  discountPercentage: number;
  shopId?: string;
  shopName?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  batchNumber?: string;
  isPerishable?: boolean;
}

export interface Shop {
  id?: number;
  shopId: string;
  name: string;
  slug?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  operatingHours?: string;
  deliveryRadiusKm?: number;
  rating?: number;
  category?: string;
  verificationStatus?: string;
  distanceKm?: number;
  deliverySla?: string;
}

export interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  thumbnail?: string;
  shopName?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  batchNumber?: string;
}

export interface TrackingStep {
  step: number;
  stage: string;
  title: string;
  description: string;
  location: string;
  timestamp: string | null;
  status: 'completed' | 'active' | 'pending';
}

export interface Order {
  id: string;
  orderId?: string;
  date?: string;
  orderDate?: string;
  items: OrderItem[];
  shippingInfo: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  };
  paymentInfo: {
    method: string;
    last4?: string;
  };
  summary: {
    subtotal: number;
    tax: number;
    shippingFee: number;
    discount: number;
    total: number;
    donation?: any;
  };
  status: string;
  trackingStage?: string;
  assignedShopId?: string;
  assignedShopName?: string;
  distanceKm?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryAddress?: string;
  estimatedDelivery: string;
  trackingTimeline?: TrackingStep[];
  createdAt?: string;
}
