import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('shopcread_theme') || 'dark';
  });

  // API & Connection state
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState(2500);

  // Modals & Drawers state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // --- Secure Authentication State ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login'); // 'login' | 'register' | '2fa' | 'forgot-password' | 'reset-password' | 'verify-email'
  const [authTempToken, setAuthTempToken] = useState(null);
  const [authInitialEmail, setAuthInitialEmail] = useState('');
  const [authResetToken, setAuthResetToken] = useState('');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isDevMailboxOpen, setIsDevMailboxOpen] = useState(false);
  const [devEmails, setDevEmails] = useState([]);

  // Persistent user state (Cart & Wishlist)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('shopcread_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('shopcread_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('shopcread_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Promo Code
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Notification Toasts
  const [toasts, setToasts] = useState([]);

  // Apply Theme class to HTML document
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

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('shopcread_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('shopcread_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('shopcread_orders', JSON.stringify(orders));
  }, [orders]);

  // Toast Helper
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Health check helper
  const pingBackend = useCallback(async () => {
    const isOnline = await checkBackendHealth();
    setBackendStatus(isOnline ? 'online' : 'offline');
    return isOnline;
  }, []);

  // Sync / Refresh Dev Mailbox
  const refreshDevEmails = useCallback(async () => {
    try {
      const emails = await fetchDevEmails();
      setDevEmails(emails);
    } catch (err) {
      console.warn('Failed to load dev emails:', err);
    }
  }, []);

  // Fetch logged-in user profile & orders on start
  const loadCurrentUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const profile = await getCurrentUser();
      if (profile) {
        setUser(profile);
        // Refresh orders for this user
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

  // Load initial Categories, Products, and User Session
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      const isOnline = await pingBackend();

      try {
        const [catData, prodData] = await Promise.all([
          fetchCategories(),
          fetchProducts({ limit: 100 })
        ]);

        setCategories(catData);
        setAllProducts(prodData.products || []);
        setProducts(prodData.products || []);

        if (isOnline) {
          await loadCurrentUser();
          await refreshDevEmails();
        }
      } catch (err) {
        console.error('Failed to initialize shop data:', err);
        setError('Failed to fetch store data. Please check connection.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Check backend health periodically every 15s
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, [pingBackend, loadCurrentUser, refreshDevEmails]);

  // Fetch / filter products when search, category, or maxPrice changes
  useEffect(() => {
    const filterProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts({
          limit: 100,
          category: selectedCategory,
          search: searchQuery,
          maxPrice: maxPriceFilter
        });
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error updating filtered products:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      filterProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, maxPriceFilter]);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Cart Operations
  const addToCart = (product, quantity = 1) => {
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

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId, delta) => {
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

  // Wishlist Operations
  const toggleWishlist = (product) => {
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

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  // Coupon Logic
  const applyCoupon = async (code) => {
    try {
      const data = await validateBackendCoupon(code);
      setAppliedCoupon(data);
      showToast(`Coupon "${code}" applied: ${data.description}`, 'success');
      return { success: true, coupon: data };
    } catch (err) {
      showToast(err.message || 'Invalid coupon code', 'error');
      return { success: false, error: err.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  // Place Order
  const createOrder = async (shippingInfo, paymentInfo, subtotal, tax, shippingFee, discount, total) => {
    const payload = {
      items: cart.map((i) => ({
        id: i.id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        category: i.category,
        thumbnail: i.thumbnail
      })),
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
      // Local fallback
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

  // --- Auth Modal Controls & Actions ---
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

  const handleLogin = async ({ email, password, rememberMe }) => {
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
        // Load orders for this user
        const userOrders = await fetchBackendOrders();
        if (userOrders) setOrders(userOrders);
        return { success: true };
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const handleLogin2FA = async ({ code, rememberMe }) => {
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
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
      throw err;
    }
  };

  const handleRegister = async ({ email, password, fullName, address }) => {
    try {
      const res = await registerUser({ email, password, fullName, address });
      showToast('Account registered! Please check your email to verify.', 'success');
      refreshDevEmails();
      setAuthInitialEmail(email);
      setAuthModalView('verify-email');
      return res;
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const handleVerifyEmail = async (token) => {
    try {
      const res = await verifyEmailAPI(token);
      showToast('Email verified successfully! You can now log in.', 'success');
      setAuthModalView('login');
      if (user) {
        setUser((prev) => (prev ? { ...prev, isVerified: true } : null));
      }
      return res;
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
      throw err;
    }
  };

  const handleResendVerification = async (email) => {
    try {
      const res = await resendVerificationAPI(email);
      showToast('Verification email resent! Check Dev Mailbox.', 'info');
      refreshDevEmails();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to resend verification', 'error');
      throw err;
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      const res = await forgotPasswordAPI(email);
      showToast('Password reset link sent! Check your inbox/Dev Mailbox.', 'info');
      refreshDevEmails();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to request password reset', 'error');
      throw err;
    }
  };

  const handleResetPassword = async ({ token, newPassword }) => {
    try {
      const res = await resetPasswordAPI({ token, newPassword });
      showToast('Password reset successful! Please log in.', 'success');
      setAuthModalView('login');
      return res;
    } catch (err) {
      showToast(err.message || 'Password reset failed', 'error');
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUserAPI();
      setUser(null);
      showToast('Logged out successfully', 'info');
      // Reset orders to empty or local
      const localOrders = localStorage.getItem('shopcread_orders');
      setOrders(localOrders ? JSON.parse(localOrders) : []);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  // Sort & Filter calculated products list
  const filteredProducts = products.filter((product) => product.price <= maxPriceFilter).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'discount') return b.discountPercentage - a.discountPercentage;
    return 0; // 'featured'
  });

  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    theme,
    toggleTheme,
    backendStatus,
    pingBackend,
    products: filteredProducts,
    allProducts,
    categories,
    loading,
    error,
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
    removeCoupon,
    toasts,
    showToast,
    removeToast,
    // Auth & Security state & methods
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
    refreshDevEmails
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
