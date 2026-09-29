import { User, Product, Order } from './models';

export interface Toast {
    id: number;
    message: string;
    type: 'info' | 'success' | 'error';
}

export interface ShopContextType {
    // Theme
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    
    // API & Connection
    backendStatus: 'online' | 'offline' | 'checking';
    pingBackend: () => Promise<boolean>;
    products: Product[];
    allProducts: Product[];
    categories: string[];
    loading: boolean;
    error: string | null;
    
    // Filters
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    maxPriceFilter: number;
    setMaxPriceFilter: (price: number) => void;
    
    // Modals & Drawers
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    isWishlistOpen: boolean;
    setIsWishlistOpen: (open: boolean) => void;
    isCheckoutOpen: boolean;
    setIsCheckoutOpen: (open: boolean) => void;
    isOrderHistoryOpen: boolean;
    setIsOrderHistoryOpen: (open: boolean) => void;
    quickViewProduct: Product | null;
    setQuickViewProduct: (product: Product | null) => void;
    
    // Cart
    cart: (Product & { quantity: number })[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: number) => void;
    updateCartQuantity: (productId: number, delta: number) => void;
    clearCart: () => void;
    cartTotalCount: number;
    
    // Wishlist
    wishlist: Product[];
    toggleWishlist: (product: Product) => void;
    isInWishlist: (productId: number) => boolean;
    
    // Orders
    orders: Order[];
    createOrder: (shippingInfo: any, paymentInfo: any, subtotal: number, tax: number, shippingFee: number, discount: number, total: number) => Promise<Order>;
    
    // Coupons
    appliedCoupon: any | null;
    applyCoupon: (code: string) => Promise<{ success: boolean; coupon?: any; error?: string }>;
    removeCoupon: () => void;
    
    // Toasts
    toasts: Toast[];
    showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
    removeToast: (id: number) => void;
    
    // Auth & Security
    user: User | null;
    setUser: (user: User | null) => void;
    authLoading: boolean;
    isAuthenticated: boolean;
    isAuthModalOpen: boolean;
    openAuthModal: (view?: string, initialEmail?: string, resetToken?: string) => void;
    closeAuthModal: () => void;
    authModalView: string;
    setAuthModalView: (view: string) => void;
    authTempToken: string | null;
    authInitialEmail: string;
    authResetToken: string;
    setAuthResetToken: (token: string) => void;
    handleLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => Promise<{ success: boolean; requires2FA?: boolean }>;
    handleLogin2FA: (credentials: { code: string; rememberMe: boolean }) => Promise<{ success: boolean }>;
    handleRegister: (credentials: { email: string; password: string; fullName: string; address: string }) => Promise<any>;
    handleVerifyEmail: (token: string) => Promise<any>;
    handleResendVerification: (email: string) => Promise<any>;
    handleForgotPassword: (email: string) => Promise<any>;
    handleResetPassword: (credentials: { token: string; newPassword: string }) => Promise<any>;
    handleLogout: () => Promise<void>;
    loadCurrentUser: () => Promise<void>;
    isSecurityModalOpen: boolean;
    setIsSecurityModalOpen: (open: boolean) => void;
    isDevMailboxOpen: boolean;
    setIsDevMailboxOpen: (open: boolean) => void;
    devEmails: any[];
    refreshDevEmails: () => Promise<void>;
}
