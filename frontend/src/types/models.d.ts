export interface User {
  id: number;
  email: string;
  name: string;
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
  rating: number;
  stock: number;
  brand: string;
  discountPercentage: number;
}

export interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  thumbnail?: string;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  shippingInfo: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
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
  };
  status: string;
  estimatedDelivery: string;
}
