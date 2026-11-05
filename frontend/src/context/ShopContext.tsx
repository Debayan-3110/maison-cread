import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Product, Order } from '../types/models';
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
  getStoredAccessToken
} from '../services/api';

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('shopcread_theme') as 'light' | 'dark') || 'light';
  });

  // API & Connection state
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(2500);

  // Modals & Drawers state
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState<boolean>(false);
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
          fetchProducts({ limit: 24 })
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

  useEffect(() => {
    const filterProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts({
          limit: 24,
          category: selectedCategory,
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
  }, [selectedCategory, searchQuery, maxPriceFilter, sortBy]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchProducts({
        limit: 24,
        skip: products.length,
        category: selectedCategory,
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
  }, [loadingMore, hasMore, products.length, selectedCategory, searchQuery, maxPriceFilter, sortBy]);

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
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
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


  const createOrder = async (shippingInfo: any, paymentInfo: any, subtotal: number, tax: number, shippingFee: number, discount: number, total: number) => {
    const payload = {
      items: cart.map((i) => {
        return {
          id: i.id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          category: i.category,
          thumbnail: i.thumbnail
        };
      }),
      shippingInfo,
      paymentInfo: {
        method: paymentInfo.method,
        last4: paymentInfo.cardNumber ? paymentInfo.cardNumber.slice(-4) : '4242'
      },
      summary: {
        subtotal,
        tax,
        shippingFee,
        discount,
        total
      }
    };

    let newOrder;
    try {
      newOrder = await createBackendOrder(payload);
    } catch {
      newOrder = {
        id: 'NX-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        items: [...cart],
        shippingInfo,
        paymentInfo: { method: paymentInfo.method, last4: paymentInfo.cardNumber ? paymentInfo.cardNumber.slice(-4) : '4242' },
        summary: { subtotal, tax, shippingFee, discount, total },
        status: 'Processing',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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

  const handleLogin = async ({ email, password, rememberMe }: { email: string; password: string; rememberMe: boolean }) => {
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
        return { success: true };
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const handleLogin2FA = async ({ code, rememberMe }: { code: string; rememberMe: boolean }) => {
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
    allProducts,
    categories,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    loadingMore,
    selectedCategory,
    setSelectedCategory,
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
    handleLogout,
    loadCurrentUser,
    isSecurityModalOpen,
    setIsSecurityModalOpen,
    isDevMailboxOpen,
    setIsDevMailboxOpen,
    devEmails,
    refreshDevEmails,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
