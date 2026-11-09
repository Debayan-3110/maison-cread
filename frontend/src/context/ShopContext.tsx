import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Product, Order, Shop } from '../types/models';
import { ShopContextType, Toast } from '../types/context';
import {
  fetchProducts,
  fetchCategories,
  validateBackendCoupon,
  createBackendOrder,
  checkBackendHealth,
  fetchBackendOrders,
  getCurrentUser,
  loginUser,
  login2FAUser,
  registerUser,
  verifyEmailAPI,
  resendVerificationAPI,
  logoutUserAPI,
  forgotPasswordAPI,
  resetPasswordAPI,
  setup2FAAPI,
  enable2FAAPI,
  disable2FAAPI,
  fetchDevEmails,
  clearAuthTokens,
  getStoredAccessToken,
  exportUserDataAPI,
  deleteUserAccountAPI,
  sendEmailOtpAPI,
  verifyEmailOtpAPI,
  sendPhoneOtpAPI,
  verifyPhoneOtpAPI,
  sendForgotPasswordOtpAPI,
  verifyForgotPasswordOtpAPI,
  getNeonGoogleAuthUrlAPI,
  verifyNeonAuthSessionAPI,
  getNearbyStoresAPI
} from '../services/api';

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ALL_INDIAN_CATEGORIES = [
  'all',
  'fashion',
  'beauty',
  'electronics',
  'home-apparels',
  'appliances',
  'toys',
  'books',
  'sports',
  'food',
  'worship',
  'liquor-tobacco'
];

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('shopcread_theme') as 'light' | 'dark') || 'dark';
  });

  // API & Connection state
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(ALL_INDIAN_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Filters state
  const [selectedCategory, setSelectedCategoryState] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [categoryGender, setCategoryGender] = useState<'all' | 'male' | 'female'>('all');
  const [liquorOriginFilter, setLiquorOriginFilter] = useState<'all' | 'imported' | 'domestic'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(300000);

  // Statutory 18+ Age Verification for Liquor & Tobacco
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem('shopcread_age_verified') === 'true';
    } catch {
      return false;
    }
  });
  const [isAgeGateOpen, setIsAgeGateOpen] = useState<boolean>(false);

  const verifyAgeAndEnterLiquor = useCallback(() => {
    try {
      localStorage.setItem('shopcread_age_verified', 'true');
    } catch (e) {
      console.warn(e);
    }
    setIsAgeVerified(true);
    setIsAgeGateOpen(false);
    setSelectedCategoryState('liquor-tobacco');
    setSelectedSubcategory('all');
    setLiquorOriginFilter('all');
  }, []);

  const setSelectedCategory = useCallback((cat: string) => {
    if (cat === 'liquor-tobacco' && !isAgeVerified) {
      setIsAgeGateOpen(true);
      return;
    }
    setSelectedCategoryState(cat);
    setSelectedSubcategory('all');
    setCategoryGender('all');
    setLiquorOriginFilter('all');
  }, [isAgeVerified]);

  // Modals & Drawers state
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState<boolean>(false);
  const [isSellerStudioOpen, setIsSellerStudioOpen] = useState<boolean>(false);
  const [isNeonHubOpen, setIsNeonHubOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // --- Secure Authentication State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<string>('login');
  const [authTempToken, setAuthTempToken] = useState<string | null>(null);
  const [authInitialEmail, setAuthInitialEmail] = useState<string>('');
  const [authResetToken, setAuthResetToken] = useState<string>('');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isDevMailboxOpen, setIsDevMailboxOpen] = useState<boolean>(false);
  const [devEmails, setDevEmails] = useState<any[]>([]);

  // Legal & Compliance Suite
  const [isLegalOpen, setIsLegalOpen] = useState<boolean>(false);
  const [currentLegalPolicy, setCurrentLegalPolicy] = useState<string>('privacy');

  // Sovereign Order Tracking & Registered Store Locator
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState<boolean>(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  const [registeredShops, setRegisteredShops] = useState<Shop[]>([]);

  const openOrderTracker = useCallback((orderId?: string) => {
    if (orderId) setTrackingOrderId(orderId);
    setIsOrderTrackerOpen(true);
  }, []);

  const closeOrderTracker = useCallback(() => {
    setIsOrderTrackerOpen(false);
  }, []);

  const refreshShops = useCallback(async () => {
    try {
      const stores = await getNearbyStoresAPI(48.8675, 2.3294, 50000.0);
      if (Array.isArray(stores)) {
        setRegisteredShops(stores);
      }
    } catch (e) {
      console.warn('Failed to load registered shops:', e);
    }
  }, []);

  // Persistent user state
  const [cart, setCart] = useState<(Product & { quantity: number })[]>(() => {
    try {
      const saved = localStorage.getItem('shopcread_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('shopcread_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('shopcread_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem('shopcread_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('shopcread_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('shopcread_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('shopcread_orders', JSON.stringify(orders));
  }, [orders]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pingBackend = useCallback(async () => {
    const isOnline = await checkBackendHealth();
    setBackendStatus(isOnline ? 'online' : 'offline');
    return isOnline;
  }, []);

  const refreshDevEmails = useCallback(async () => {
    try {
      const emails = await fetchDevEmails();
      setDevEmails(emails);
    } catch (err) {
      console.warn('Failed to load dev emails:', err);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const profile = await getCurrentUser();
      if (profile) {
        setUser(profile);
        const userOrders = await fetchBackendOrders();
        if (userOrders && Array.isArray(userOrders)) {
          setOrders(userOrders);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      const isOnline = await pingBackend();
      try {
        const [catData, prodData] = await Promise.all([
          fetchCategories(),
          fetchProducts({ limit: 50 })
        ]);
        setCategories(catData);
        setAllProducts(prodData.products || []);
        setProducts(prodData.products || []);
        setTotalCount(prodData.total || (prodData.products ? prodData.products.length : 0));
        setHasMore(Boolean(prodData.hasMore));
        if (isOnline) {
          await loadCurrentUser();
          await refreshDevEmails();
        }
      } catch (err) {
        setError('Failed to fetch store data.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, [pingBackend, loadCurrentUser, refreshDevEmails]);

  const refreshCatalog = useCallback(async () => {
    try {
      const prodData = await fetchProducts({ limit: 50 });
      if (prodData && prodData.products) {
        setAllProducts(prodData.products);
        setProducts(prodData.products);
        setTotalCount(prodData.total || prodData.products.length);
      }
    } catch (err) {
      console.warn('Could not refresh catalog:', err);
    }
  }, []);

  const addSellerProduct = useCallback((newProduct: any) => {
    setProducts((prev) => [newProduct, ...prev]);
    setAllProducts((prev) => [newProduct, ...prev]);
    setTotalCount((prev) => (prev ? prev + 1 : 1));
    showToast(`✓ "${newProduct.title}" published and live in inventory!`, 'success');
  }, [showToast]);

  useEffect(() => {
    const filterProducts = async () => {
      setLoading(true);
      try {
        const activeSubcat = (selectedCategory === 'fashion' || selectedCategory === 'beauty')
          ? (categoryGender !== 'all' ? categoryGender : (selectedSubcategory !== 'all' ? selectedSubcategory : ''))
          : (selectedCategory === 'liquor-tobacco'
              ? (liquorOriginFilter !== 'all' ? liquorOriginFilter : (selectedSubcategory !== 'all' ? selectedSubcategory : ''))
              : (selectedSubcategory !== 'all' ? selectedSubcategory : ''));

        const data = await fetchProducts({
          limit: 50,
          category: selectedCategory,
          subcategory: activeSubcat,
          search: searchQuery,
          maxPrice: maxPriceFilter,
          sortBy: sortBy
        });
        setProducts(data.products || []);
        setTotalCount(data.total || (data.products ? data.products.length : 0));
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        console.error('Error updating filtered products:', err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(filterProducts, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSubcategory, categoryGender, liquorOriginFilter, searchQuery, maxPriceFilter, sortBy]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const activeSubcat = (selectedCategory === 'fashion' || selectedCategory === 'beauty')
        ? (categoryGender !== 'all' ? categoryGender : (selectedSubcategory !== 'all' ? selectedSubcategory : ''))
        : (selectedCategory === 'liquor-tobacco'
            ? (liquorOriginFilter !== 'all' ? liquorOriginFilter : (selectedSubcategory !== 'all' ? selectedSubcategory : ''))
            : (selectedSubcategory !== 'all' ? selectedSubcategory : ''));

      const data = await fetchProducts({
        limit: 50,
        skip: products.length,
        category: selectedCategory,
        subcategory: activeSubcat,
        search: searchQuery,
        maxPrice: maxPriceFilter,
        sortBy: sortBy
      });
      const newItems = data.products || [];
      setProducts((prev) => [...prev, ...newItems]);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, products.length, selectedCategory, selectedSubcategory, categoryGender, liquorOriginFilter, searchQuery, maxPriceFilter, sortBy]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const activeSubcat = (selectedCategory === 'fashion' || selectedCategory === 'beauty')
        ? (categoryGender !== 'all' ? categoryGender : (selectedSubcategory !== 'all' ? selectedSubcategory : ''))
        : (selectedCategory === 'liquor-tobacco'
            ? (liquorOriginFilter !== 'all' ? liquorOriginFilter : (selectedSubcategory !== 'all' ? selectedSubcategory : ''))
            : (selectedSubcategory !== 'all' ? selectedSubcategory : ''));

      const data = await fetchProducts({
        limit: 250,
        skip: 0,
        category: selectedCategory,
        subcategory: activeSubcat,
        search: searchQuery,
        maxPrice: maxPriceFilter,
        sortBy: sortBy
      });
      setProducts(data.products || []);
      setTotalCount(data.total || (data.products ? data.products.length : 0));
      setHasMore(false);
    } catch (err) {
      console.error('Failed to load all products:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubcategory, categoryGender, liquorOriginFilter, searchQuery, maxPriceFilter, sortBy]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    showToast(`Added "${product.title}" to cart`, 'success');
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart.flatMap((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? [{ ...item, quantity: newQty }] : [];
        }
        return [item];
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id);
      if (exists) {
        showToast(`Removed "${product.title}" from wishlist`, 'info');
        return prevWishlist.filter((item) => item.id !== product.id);
      } else {
        showToast(`Saved "${product.title}" to wishlist`, 'success');
        return [...prevWishlist, product];
      }
    });
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item) => item.id === productId);
  };

  const applyCoupon = async (code: string) => {
    try {
      const data = await validateBackendCoupon(code);
      setAppliedCoupon(data);
      showToast(`Coupon "${code}" applied: ${data.description}`, 'success');
      return { success: true, coupon: data };
    } catch (err: any) {
      showToast(err.message || 'Invalid coupon code', 'error');
      return { success: false, error: err.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const processAIAction = useCallback(async (action: { type: string; payload: any }) => {
    const { type, payload } = action;

    switch (type) {
      case 'ADD_TO_CART': {
        const product = allProducts.find(p => p.id === payload.product_id);
        if (product) {
          addToCart(product, payload.quantity || 1);
        } else {
          showToast('AI could not find the product in the catalog', 'error');
        }
        break;
      }
      case 'CHECK_STOCK': {
        const product = allProducts.find(p => p.id === payload.product_id);
        if (product) {
          showToast(`Current stock for ${product.title}: ${product.stock} units`, 'info');
        } else {
          showToast('Product not found', 'error');
        }
        break;
      }
      case 'RECOMMEND_PRODUCTS': {
        showToast(`I'm looking for the best ${payload.category} products for you...`, 'info');
        // The recommendation list is handled by the ChatbotWidget's response rendering
        break;
      }
      default:
        showToast('AI action not recognized', 'error');
    }
  }, [allProducts, addToCart, showToast]);


  const createOrder = async (
    shippingInfo: any,
    paymentInfo: any,
    subtotal: number,
    tax: number,
    shippingFee: number,
    discount: number,
    total: number,
    donation?: any,
    deliveryLat?: number,
    deliveryLng?: number
  ) => {
    const payload = {
      items: cart.map((i) => {
        return {
          id: i.id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          category: i.category,
          thumbnail: i.thumbnail,
          shopName: i.shopName,
          expiryDate: i.expiryDate,
          manufacturingDate: i.manufacturingDate,
          batchNumber: i.batchNumber
        };
      }),
      shipping: shippingInfo,
      shippingInfo,
      deliveryLat: deliveryLat || shippingInfo?.latitude,
      deliveryLng: deliveryLng || shippingInfo?.longitude,
      payment: paymentInfo,
      paymentInfo: {
        method: paymentInfo.method,
        last4: paymentInfo.cardNumber ? paymentInfo.cardNumber.slice(-4) : '4242'
      },
      summary: {
        subtotal,
        tax,
        shippingFee,
        discount,
        total,
        donation: donation || null
      }
    };

    let newOrder: Order;
    try {
      newOrder = await createBackendOrder(payload);
    } catch {
      newOrder = {
        id: 'MC-ORD-2026-' + Math.floor(10000 + Math.random() * 90000),
        orderId: 'MC-ORD-2026-' + Math.floor(10000 + Math.random() * 90000),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        shippingInfo,
        paymentInfo: { method: paymentInfo.method, last4: paymentInfo.cardNumber ? paymentInfo.cardNumber.slice(-4) : '4242' },
        summary: { subtotal, tax, shippingFee, discount, total, donation: donation || null },
        status: 'confirmed_by_shop',
        trackingStage: 'confirmed_by_shop',
        estimatedDelivery: '2-3 business days'
      };
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setAppliedCoupon(null);
    return newOrder;
  };

  const openAuthModal = (view = 'login', initialEmail = '', resetToken = '') => {
    setAuthModalView(view);
    if (initialEmail) setAuthInitialEmail(initialEmail);
    if (resetToken) setAuthResetToken(resetToken);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthTempToken(null);
  };

  const handleLogin = async ({ email, password, rememberMe }: { email: string; password: string; rememberMe: boolean }): Promise<{ success: boolean; requires2FA?: boolean }> => {
    try {
      const res = await loginUser({ email, password, rememberMe });
      if (res.status === '2fa_required') {
        setAuthTempToken(res.tempToken);
        setAuthModalView('2fa');
        showToast('Two-factor code required.', 'info');
        return { success: false, requires2FA: true };
      }
      if (res.status === 'authenticated') {
        setUser(res.user);
        closeAuthModal();
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        const userOrders = await fetchBackendOrders();
        if (userOrders) setOrders(userOrders);
        return { success: true, requires2FA: false };
      }
      return { success: false, requires2FA: false };
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const handleLogin2FA = async ({ code, rememberMe }: { code: string; rememberMe: boolean }): Promise<{ success: boolean }> => {
    try {
      const res = await login2FAUser({ tempToken: authTempToken, code, rememberMe });
      if (res.status === 'authenticated') {
        setUser(res.user);
        closeAuthModal();
        showToast(`2FA Verified. Welcome, ${res.user.name}!`, 'success');
        const userOrders = await fetchBackendOrders();
        if (userOrders) setOrders(userOrders);
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
      throw err;
    }
  };

  const handleRegister = async ({ email, password, fullName, address }: { email: string; password: string; fullName: string; address: string }) => {
    try {
      const res = await registerUser({ email, password, fullName, address });
      showToast('Account registered! Please check your email to verify.', 'success');
      refreshDevEmails();
      setAuthInitialEmail(email);
      setAuthModalView('verify-email');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const handleVerifyEmail = async (token: string) => {
    try {
      const res = await verifyEmailAPI(token);
      showToast('Email verified successfully! You can now log in.', 'success');
      setAuthModalView('login');
      if (user) {
        setUser((prev) => (prev ? { ...prev, isVerified: true } : null));
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
      throw err;
    }
  };

  const handleResendVerification = async (email: string) => {
    try {
      const res = await resendVerificationAPI(email);
      showToast('Verification email resent! Check Dev Mailbox.', 'info');
      refreshDevEmails();
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to resend verification', 'error');
      throw err;
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      const res = await forgotPasswordAPI(email);
      showToast('Password reset link sent! Check your inbox/Dev Mailbox.', 'info');
      refreshDevEmails();
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to request password reset', 'error');
      throw err;
    }
  };

  const handleResetPassword = async ({ token, newPassword }: { token: string; newPassword: string }) => {
    try {
      const res = await resetPasswordAPI({ token, newPassword });
      showToast('Password reset successful! Please log in.', 'success');
      setAuthModalView('login');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
      throw err;
    }
  };

  const handleEmailSendOtp = async (email: string, purpose: 'login' | 'signup' = 'login') => {
    try {
      const res = await sendEmailOtpAPI({ email, purpose });
      showToast(`Verification passcode dispatched via SMTP to ${email}`, 'info');
      refreshDevEmails();
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch email OTP via SMTP', 'error');
      throw err;
    }
  };

  const handleEmailVerifyOtp = async (payload: { email: string; otp: string; fullName?: string; rememberMe?: boolean }) => {
    try {
      const res = await verifyEmailOtpAPI(payload);
      if (res.user) {
        setUser(res.user);
        closeAuthModal();
        showToast(res.message || 'Welcome to Maison Cread!', 'success');
        try {
          const remoteOrders = await fetchBackendOrders();
          setOrders(remoteOrders);
        } catch {
          // fallback
        }
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Email OTP verification failed', 'error');
      throw err;
    }
  };

  const handlePhoneSendOtp = async (phone: string, purpose: 'login' | 'signup' = 'login') => {
    try {
      const res = await sendPhoneOtpAPI({ phone, purpose });
      showToast(`Verification code dispatched to ${phone}`, 'info');
      refreshDevEmails();
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch phone OTP', 'error');
      throw err;
    }
  };

  const handlePhoneVerifyOtp = async (payload: { phone: string; otp: string; fullName?: string; rememberMe?: boolean }) => {
    try {
      const res = await verifyPhoneOtpAPI(payload);
      if (res.user) {
        setUser(res.user);
        closeAuthModal();
        showToast(res.message || 'Welcome to Maison Cread!', 'success');
        try {
          const remoteOrders = await fetchBackendOrders();
          setOrders(remoteOrders);
        } catch {
          // fallback
        }
      }
      return res;
    } catch (err: any) {
      showToast(err.message || 'Phone verification failed', 'error');
      throw err;
    }
  };

  const handleForgotPasswordSendOtp = async (identifier: string) => {
    try {
      const res = await sendForgotPasswordOtpAPI(identifier);
      showToast(`Verification code sent to ${identifier}`, 'info');
      refreshDevEmails();
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to send verification code', 'error');
      throw err;
    }
  };

  const handleForgotPasswordVerifyOtp = async (payload: { identifier: string; otp: string; newPassword: string }) => {
    try {
      const res = await verifyForgotPasswordOtpAPI(payload);
      showToast('Password reset successfully! Please log in.', 'success');
      setAuthModalView('login');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Password reset verification failed', 'error');
      throw err;
    }
  };

  const handleNeonGoogleLogin = async () => {
    try {
      const res = await getNeonGoogleAuthUrlAPI();
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('Google authorization URL was not returned by Neon Auth.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to initialize Google login via Neon Auth', 'error');
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUserAPI();
      setUser(null);
      showToast('Logged out successfully', 'info');
      const localOrders = localStorage.getItem('shopcread_orders');
      setOrders(localOrders ? JSON.parse(localOrders) : []);
    } catch (err: any) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  const openLegalPolicy = useCallback((policyKey: string = 'privacy') => {
    setCurrentLegalPolicy(policyKey);
    setIsLegalOpen(true);
    window.location.hash = `/legal/${policyKey}`;
  }, []);

  const closeLegalPolicy = useCallback(() => {
    setIsLegalOpen(false);
    if (window.location.hash.startsWith('#/legal')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const openCookiePreferences = useCallback(() => {
    window.dispatchEvent(new CustomEvent('shopcread_open_cookie_banner'));
  }, []);

  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/legal')) {
        const parts = hash.split('/');
        const policy = parts[2] || 'privacy';
        setCurrentLegalPolicy(policy);
        setIsLegalOpen(true);
      }
    };
    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  const handleExportPersonalData = useCallback(async () => {
    try {
      const data = await exportUserDataAPI();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ShopCread_Data_Export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Personal data exported successfully (DPDP / GDPR Art 20)', 'success');
      return data;
    } catch (err: any) {
      showToast(err.message || 'Failed to export data', 'error');
      throw err;
    }
  }, [showToast]);

  const handleDeleteAccount = useCallback(async (password: string, confirmationPhrase: string) => {
    try {
      const res = await deleteUserAccountAPI(password, confirmationPhrase);
      clearAuthTokens();
      setUser(null);
      setCart([]);
      setWishlist([]);
      localStorage.removeItem('shopcread_cart');
      localStorage.removeItem('shopcread_wishlist');
      setIsSecurityModalOpen(false);
      showToast('Account permanently erased under DPDP Sec 12 / GDPR Art 17', 'info');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Account erasure failed', 'error');
      throw err;
    }
  }, [showToast]);

  const filteredProducts = products.filter((product) => product.price <= maxPriceFilter).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'discount') return b.discountPercentage - a.discountPercentage;
    return 0;
  });

  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const value: ShopContextType = {
    theme,
    toggleTheme,
    backendStatus,
    pingBackend,
    products: filteredProducts,
    setProducts,
    allProducts,
    setAllProducts,
    categories,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    loadAll,
    loadingMore,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    categoryGender,
    setCategoryGender,
    liquorOriginFilter,
    setLiquorOriginFilter,
    isAgeVerified,
    setIsAgeVerified,
    isAgeGateOpen,
    setIsAgeGateOpen,
    verifyAgeAndEnterLiquor,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    maxPriceFilter,
    setMaxPriceFilter,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotalCount,
    wishlist,
    toggleWishlist,
    isInWishlist,
    orders,
    createOrder,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isOrderHistoryOpen,
    setIsOrderHistoryOpen,
    quickViewProduct,
    setQuickViewProduct,
    appliedCoupon,
    applyCoupon,
    processAIAction,
    removeCoupon,
    toasts,
    showToast,
    removeToast,
    user,
    setUser,
    authLoading,
    isAuthenticated: Boolean(user),
    isAuthModalOpen,
    setIsAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    authModalView,
    setAuthModalView,
    authTempToken,
    authInitialEmail,
    authResetToken,
    setAuthResetToken,
    handleLogin,
    handleLogin2FA,
    handleRegister,
    handleVerifyEmail,
    handleResendVerification,
    handleForgotPassword,
    handleResetPassword,
    handleEmailSendOtp,
    handleEmailVerifyOtp,
    handlePhoneSendOtp,
    handlePhoneVerifyOtp,
    handleForgotPasswordSendOtp,
    handleForgotPasswordVerifyOtp,
    handleNeonGoogleLogin,
    handleLogout,
    loadCurrentUser,
    isSecurityModalOpen,
    setIsSecurityModalOpen,
    isDevMailboxOpen,
    setIsDevMailboxOpen,
    devEmails,
    refreshDevEmails,
    isSellerStudioOpen,
    setIsSellerStudioOpen,
    isNeonHubOpen,
    setIsNeonHubOpen,
    addSellerProduct,
    refreshCatalog,
    isLegalOpen,
    setIsLegalOpen,
    currentLegalPolicy,
    openLegalPolicy,
    closeLegalPolicy,
    openCookiePreferences,
    handleExportPersonalData,
    handleDeleteAccount,
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    trackingOrderId,
    setTrackingOrderId,
    openOrderTracker,
    closeOrderTracker,
    registeredShops,
    refreshShops,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
