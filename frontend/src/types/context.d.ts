import type React from 'react';
import { User, Product, Order, Shop } from './models';

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
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    allProducts: Product[];
    setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    categories: string[];
    loading: boolean;
    error: string | null;
    totalCount?: number;
    hasMore?: boolean;
    loadMore?: () => Promise<void>;
    loadAll?: () => Promise<void>;
    loadingMore?: boolean;
    
    // Filters
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    selectedSubcategory: string;
    setSelectedSubcategory: (subcat: string) => void;
    categoryGender: 'all' | 'male' | 'female';
    setCategoryGender: (gender: 'all' | 'male' | 'female') => void;
    liquorOriginFilter: 'all' | 'imported' | 'domestic';
    setLiquorOriginFilter: (origin: 'all' | 'imported' | 'domestic') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    maxPriceFilter: number;
    setMaxPriceFilter: (price: number) => void;
    
    // Statutory Age Gate (18+ Verification for Liquor & Tobacco)
    isAgeVerified: boolean;
    setIsAgeVerified: (verified: boolean) => void;
    isAgeGateOpen: boolean;
    setIsAgeGateOpen: (open: boolean) => void;
    verifyAgeAndEnterLiquor: () => void;
    
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
    
    // Orders & Sovereign Tracking
    orders: Order[];
    createOrder: (shippingInfo: any, paymentInfo: any, subtotal: number, tax: number, shippingFee: number, discount: number, total: number, donation?: any, deliveryLat?: number, deliveryLng?: number) => Promise<Order>;
    isOrderTrackerOpen: boolean;
    setIsOrderTrackerOpen: (open: boolean) => void;
    trackingOrderId: string;
    setTrackingOrderId: (id: string) => void;
    openOrderTracker: (orderId?: string) => void;
    closeOrderTracker: () => void;
    registeredShops: Shop[];
    refreshShops: () => Promise<void>;
    
    // Coupons
    appliedCoupon: any | null;
    applyCoupon: (code: string) => Promise<{ success: boolean; coupon?: any; error?: string }>;
    processAIAction: (action: { type: string; payload: any }) => Promise<void>;
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
    setIsAuthModalOpen: (open: boolean) => void;
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
    handleEmailSendOtp: (email: string, purpose?: 'login' | 'signup') => Promise<any>;
    handleEmailVerifyOtp: (payload: { email: string; otp: string; fullName?: string; rememberMe?: boolean }) => Promise<any>;
    handlePhoneSendOtp: (phone: string, purpose?: 'login' | 'signup') => Promise<any>;
    handlePhoneVerifyOtp: (payload: { phone: string; otp: string; fullName?: string; rememberMe?: boolean }) => Promise<any>;
    handleForgotPasswordSendOtp: (identifier: string) => Promise<any>;
    handleForgotPasswordVerifyOtp: (payload: { identifier: string; otp: string; newPassword: string }) => Promise<any>;
    handleNeonGoogleLogin: () => Promise<void>;
    handleLogout: () => Promise<void>;
    loadCurrentUser: () => Promise<void>;
    isSecurityModalOpen: boolean;
    setIsSecurityModalOpen: (open: boolean) => void;
    isDevMailboxOpen: boolean;
    setIsDevMailboxOpen: (open: boolean) => void;
    devEmails: any[];
    refreshDevEmails: () => Promise<void>;
    isSellerStudioOpen: boolean;
    setIsSellerStudioOpen: (open: boolean) => void;
    isNeonHubOpen: boolean;
    setIsNeonHubOpen: (open: boolean) => void;
    addSellerProduct: (product: any) => void;
    refreshCatalog: () => Promise<void>;

    // Legal & Compliance Suite
    isLegalOpen: boolean;
    setIsLegalOpen: (open: boolean) => void;
    currentLegalPolicy: string;
    openLegalPolicy: (policyKey?: string) => void;
    closeLegalPolicy: () => void;
    openCookiePreferences: () => void;
    handleExportPersonalData: () => Promise<any>;
    handleDeleteAccount: (password: string, confirmationPhrase: string) => Promise<any>;
}
