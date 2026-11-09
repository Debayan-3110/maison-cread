const RAW_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/+$/, '')
  : '/api';

const BASE_URL = RAW_BASE_URL.endsWith('/api') ? RAW_BASE_URL : `${RAW_BASE_URL}/api`;

// Token Management
let currentAccessToken = localStorage.getItem('shopcread_access_token') || null;
let currentRefreshToken = localStorage.getItem('shopcread_refresh_token') || null;
let currentCsrfToken = null;

export function setAuthTokens(accessToken, refreshToken = null) {
  currentAccessToken = accessToken;
  if (accessToken) {
    localStorage.setItem('shopcread_access_token', accessToken);
  } else {
    localStorage.removeItem('shopcread_access_token');
  }

  if (refreshToken !== null) {
    currentRefreshToken = refreshToken;
    if (refreshToken) {
      localStorage.setItem('shopcread_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('shopcread_refresh_token');
    }
  }
}

export function getStoredAccessToken() {
  return currentAccessToken;
}

export function clearAuthTokens() {
  currentAccessToken = null;
  currentRefreshToken = null;
  localStorage.removeItem('shopcread_access_token');
  localStorage.removeItem('shopcread_refresh_token');
}

// CSRF Token synchronization
export async function getCsrfToken() {
  if (currentCsrfToken) return currentCsrfToken;
  try {
    const res = await fetch(`${BASE_URL}/csrf-token`);
    if (res.ok) {
      const data = await res.json();
      currentCsrfToken = data.csrfToken;
      return currentCsrfToken;
    }
  } catch (err) {
    console.warn('Could not fetch CSRF token:', err);
  }
  return null;
}

// Base Fetch Wrapper with Bearer Auth, CSRF, and Automatic 401 Refresh Interceptor
export async function secureFetch(url, options = {}, isRetry = false) {
  const headers = new Headers(options.headers || {});

  // Add Content-Type if payload exists and not already set
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Access Token if available
  if (currentAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  // Attach CSRF Token for mutating methods
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrf = await getCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // include cookies for refresh tokens and csrf
  });

  // Check if response contains new CSRF token in header
  const newCsrf = response.headers.get('X-CSRF-Token');
  if (newCsrf) {
    currentCsrfToken = newCsrf;
  }

  // Automatic 401 Token Refresh Handling
  if (response.status === 401 && !isRetry && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    try {
      const refreshed = await refreshTokenAPI();
      if (refreshed && refreshed.accessToken) {
        // Retry the original request with new access token
        return await secureFetch(url, options, true);
      }
    } catch {
      clearAuthTokens();
    }
  }

  return response;
}

// --- Health Check ---
export async function checkBackendHealth() {
  try {
    const res = await secureFetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'online';
  } catch {
    return false;
  }
}

// ============================================================================
// AUTHENTICATION SERVICES
// ============================================================================

export async function registerUser({ email, password, fullName, address = '' }) {
  const res = await secureFetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName, address })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  return data;
}

export async function loginUser({ email, password, rememberMe = false }) {
  const res = await secureFetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  if (data.status === 'authenticated') {
    setAuthTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function login2FAUser({ tempToken, code, rememberMe = false }) {
  const res = await secureFetch(`${BASE_URL}/auth/login-2fa`, {
    method: 'POST',
    body: JSON.stringify({ tempToken, code, rememberMe })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || '2FA verification failed');
  }

  if (data.status === 'authenticated') {
    setAuthTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function verifyEmailAPI(token) {
  const res = await secureFetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    body: JSON.stringify({ token })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Email verification failed');
  }
  return data;
}

export async function resendVerificationAPI(email) {
  const res = await secureFetch(`${BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to resend verification');
  }
  return data;
}

export async function refreshTokenAPI() {
  const refreshStored = currentRefreshToken || localStorage.getItem('shopcread_refresh_token');
  const res = await secureFetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshStored })
  });

  if (!res.ok) {
    clearAuthTokens();
    return null;
  }

  const data = await res.json();
  if (data.accessToken) {
    setAuthTokens(data.accessToken, data.refreshToken);
    return data;
  }
  return null;
}

export async function logoutUserAPI() {
  const refreshStored = currentRefreshToken || localStorage.getItem('shopcread_refresh_token');
  try {
    await secureFetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshStored })
    });
  } finally {
    clearAuthTokens();
  }
  return true;
}

export async function forgotPasswordAPI(email) {
  const res = await secureFetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to send password reset instructions');
  }
  return data;
}

export async function resetPasswordAPI({ token, newPassword }) {
  const res = await secureFetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Password reset failed');
  }
  return data;
}

// --- Phone OTP & Neon Auth Extensions ---

export async function sendEmailOtpAPI({ email, purpose = 'login' }) {
  const res = await secureFetch(`${BASE_URL}/auth/email/send-otp`, {
    method: 'POST',
    body: JSON.stringify({ email, purpose })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to dispatch email OTP via SMTP');
  }
  return data;
}

export async function verifyEmailOtpAPI({ email, otp, fullName = '', rememberMe = false }) {
  const res = await secureFetch(`${BASE_URL}/auth/email/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ email, otp, fullName, rememberMe })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Email verification failed');
  }
  if (data.accessToken) {
    setAuthTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function getSmtpStatusAPI() {
  const res = await secureFetch(`${BASE_URL}/auth/smtp/status`);
  if (!res.ok) return null;
  return await res.json();
}

export async function testSmtpConnectionAPI(recipient) {
  const res = await secureFetch(`${BASE_URL}/auth/smtp/test`, {
    method: 'POST',
    body: JSON.stringify({ recipient })
  });
  return await res.json();
}

export async function sendPhoneOtpAPI({ phone, purpose = 'login' }) {
  const res = await secureFetch(`${BASE_URL}/auth/phone/send-otp`, {
    method: 'POST',
    body: JSON.stringify({ phone, purpose })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to dispatch phone OTP');
  }
  return data;
}

export async function verifyPhoneOtpAPI({ phone, otp, fullName = '', rememberMe = false }) {
  const res = await secureFetch(`${BASE_URL}/auth/phone/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ phone, otp, fullName, rememberMe })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Phone verification failed');
  }
  if (data.accessToken) {
    setAuthTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function sendForgotPasswordOtpAPI(identifier) {
  const res = await secureFetch(`${BASE_URL}/auth/forgot-password/send-otp`, {
    method: 'POST',
    body: JSON.stringify({ identifier })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to dispatch password recovery code');
  }
  return data;
}

export async function verifyForgotPasswordOtpAPI({ identifier, otp, newPassword }) {
  const res = await secureFetch(`${BASE_URL}/auth/forgot-password/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ identifier, otp, newPassword })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Password reset verification failed');
  }
  return data;
}

/**
 * @param {string | null} [origin]
 */
export async function getNeonGoogleAuthUrlAPI(origin = null) {
  const originUrl = origin || window.location.origin;
  const res = await secureFetch(`${BASE_URL}/auth/neon/google-url`, {
    method: 'POST',
    body: JSON.stringify({ origin: originUrl })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to initiate Neon Google Auth');
  }
  return data;
}

/**
 * @param {{ token?: string | null, sessionToken?: string | null, rememberMe?: boolean }} [options]
 */
export async function verifyNeonAuthSessionAPI({ token = null, sessionToken = null, rememberMe = false } = {}) {
  const res = await secureFetch(`${BASE_URL}/auth/neon/verify-session`, {
    method: 'POST',
    body: JSON.stringify({ token, sessionToken, rememberMe })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to verify Neon Auth session');
  }
  if (data.accessToken) {
    setAuthTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function getCurrentUser() {
  if (!currentAccessToken) return null;
  try {
    const res = await secureFetch(`${BASE_URL}/auth/me`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function setup2FAAPI() {
  const res = await secureFetch(`${BASE_URL}/auth/2fa/setup`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to initiate 2FA setup');
  return data;
}

export async function enable2FAAPI(code) {
  const res = await secureFetch(`${BASE_URL}/auth/2fa/enable`, {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to enable 2FA');
  return data;
}

export async function disable2FAAPI(password) {
  const res = await secureFetch(`${BASE_URL}/auth/2fa/disable`, {
    method: 'POST',
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to disable 2FA');
  return data;
}

export async function fetchDevEmails() {
  try {
    const res = await secureFetch(`${BASE_URL}/auth/dev-emails`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}


// ============================================================================
// CATALOG & ORDER SERVICES
// ============================================================================

/**
 * @param {{ limit?: number, skip?: number, category?: string, search?: string, sortBy?: string, order?: string, maxPrice?: number | string | null }} [options]
 */
export async function fetchProducts({ limit = 50, skip = 0, category = '', subcategory = '', search = '', sortBy = '', order = '', maxPrice = null } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('skip', skip);
    if (category) params.append('category', category);
    if (subcategory) params.append('subcategory', subcategory);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (order) params.append('order', order);
    if (maxPrice !== null && maxPrice !== undefined) params.append('maxPrice', maxPrice);

    const res = await secureFetch(`${BASE_URL}/products?${params.toString()}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching products from Python backend:', error);
    // Fallback to DummyJSON if backend unreachable
    try {
      let fallbackUrl = `https://dummyjson.com/products?limit=${limit}&skip=${skip}`;
      if (search) fallbackUrl = `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}`;
      else if (category && category !== 'all') fallbackUrl = `https://dummyjson.com/products/category/${encodeURIComponent(category)}`;
      const res = await fetch(fallbackUrl);
      return await res.json();
    } catch {
      throw error;
    }
  }
}

export async function fetchCategories() {
  try {
    const res = await secureFetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching categories from backend:', error);
    return ['all', 'clothes', 'electronics', 'furniture', 'shoes', 'miscellaneous', 'groceries', 'womens-clothing', 'fragrances', 'beauty', 'mens-clothing', 'jewelery'];
  }
}

export async function fetchProductById(id) {
  try {
    const res = await secureFetch(`${BASE_URL}/products/${id}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
}

export async function validateBackendCoupon(code) {
  try {
    const res = await secureFetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Invalid coupon');
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function createBackendOrder(orderPayload) {
  try {
    const res = await secureFetch(`${BASE_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) throw new Error(`Failed to place order: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error placing order on backend:', error);
    throw error;
  }
}

export async function fetchBackendOrders() {
  try {
    const res = await secureFetch(`${BASE_URL}/orders`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching orders from backend:', error);
    return null;
  }
}

export async function fetchDailyFreshStatus() {
  try {
    const res = await secureFetch(`${BASE_URL}/fresh/daily-status`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily fresh status:', error);
    return null;
  }
}

export async function calculateDonationImpact(amount, beneficiary = "Sunshine Children's Sanctuary") {
  try {
    const res = await secureFetch(`${BASE_URL}/donations/calculate`, {
      method: 'POST',
      body: JSON.stringify({ amount, beneficiary })
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error calculating donation impact:', error);
    return null;
  }
}

export async function createSellerProduct(productData) {
  try {
    const res = await secureFetch(`${BASE_URL}/seller/products`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating seller product:', error);
    throw error;
  }
}

export async function fetchSellerInventory() {
  try {
    const res = await secureFetch(`${BASE_URL}/seller/inventory`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching seller inventory:', error);
    return null;
  }
}

/**
 * @param {number|string} productId
 * @param {number} stock
 * @param {string | null} [harvestTimestamp]
 */
export async function updateSellerProductStock(productId, stock, harvestTimestamp = null) {
  try {
    const res = await secureFetch(`${BASE_URL}/seller/inventory/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock, harvestTimestamp })
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
}

// ============================================================================
// Neon Cloud Services API (Postgres, Storage, Functions, Auth, Realtime)
// ============================================================================

export async function fetchNeonHealth() {
  try {
    const res = await secureFetch(`${BASE_URL}/neon/health`);
    if (!res.ok) throw new Error(`Neon Health Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching Neon health:', error);
    return null;
  }
}

export async function fetchNeonProducts(limit = 10) {
  try {
    const res = await secureFetch(`${BASE_URL}/neon/products?limit=${limit}`);
    if (!res.ok) throw new Error(`Neon Products Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching Neon products:', error);
    return null;
  }
}

export async function uploadToNeonStorage(filename, content, contentType = 'text/plain') {
  try {
    const res = await secureFetch(`${BASE_URL}/neon/storage/upload`, {
      method: 'POST',
      body: JSON.stringify({ filename, content, contentType })
    });
    if (!res.ok) throw new Error(`Neon Storage Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error uploading to Neon storage:', error);
    throw error;
  }
}

export async function fetchNeonStorageFiles() {
  try {
    const res = await secureFetch(`${BASE_URL}/neon/storage/files`);
    if (!res.ok) throw new Error(`Neon Storage Files Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching Neon storage files:', error);
    return null;
  }
}

export async function invokeNeonFunction() {
  try {
    const res = await secureFetch(`${BASE_URL}/neon/functions/hello`);
    if (!res.ok) throw new Error(`Neon Function Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error invoking Neon function:', error);
    return null;
  }
}

export async function fetchNeonAuthConfig() {
  try {
    const res = await secureFetch(`${BASE_URL}/auth/neon/config`);
    if (!res.ok) {
      const fallback = await secureFetch(`${BASE_URL}/neon/auth/config`);
      if (!fallback.ok) throw new Error(`Neon Auth Config Error: ${res.status}`);
      return await fallback.json();
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching Neon auth config:', error);
    return null;
  }
}

export async function fetchNeonRealtimeInfo() {
  try {
    const res = await secureFetch(`${BASE_URL}/neon/realtime/info`);
    if (!res.ok) throw new Error(`Neon Realtime Info Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching Neon realtime info:', error);
    return null;
  }
}

export async function fetchCockroachStatus() {
  try {
    const res = await secureFetch(`${BASE_URL}/cockroach/status`);
    if (!res.ok) throw new Error(`Cockroach Status Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching Cockroach status:', error);
    return null;
  }
}

// ============================================================================
// Cloudinary Image Storage & CDN Edge Cache API
// ============================================================================

export async function fetchCloudinaryStatus() {
  try {
    const res = await secureFetch(`${BASE_URL}/cloudinary/status`);
    if (!res.ok) throw new Error(`Cloudinary Status Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching Cloudinary status:', error);
    return null;
  }
}

export async function uploadToCloudinary(file, folder = 'shopcread/products') {
  try {
    const res = await secureFetch(`${BASE_URL}/cloudinary/upload`, {
      method: 'POST',
      body: JSON.stringify({ file, folder })
    });
    if (!res.ok) throw new Error(`Cloudinary Upload Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

export async function fetchCloudinaryAssets(limit = 15) {
  try {
    const res = await secureFetch(`${BASE_URL}/cloudinary/assets?limit=${limit}`);
    if (!res.ok) throw new Error(`Cloudinary Assets Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching Cloudinary assets:', error);
    return null;
  }
}

export async function optimizeImageUrlWithCloudinary(url, width = 800) {
  try {
    const res = await secureFetch(`${BASE_URL}/cloudinary/optimize?url=${encodeURIComponent(url)}&width=${width}`);
    if (!res.ok) throw new Error(`Cloudinary Optimize Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error optimizing image with Cloudinary:', error);
    return null;
  }
}

/**
 * Data Sovereignty: DPDP Act 2023 Sec 11 & GDPR Art 20 Data Portability Export
 */
export async function exportUserDataAPI() {
  const res = await secureFetch(`${BASE_URL}/auth/export-data`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to export data' }));
    throw new Error(err.detail || 'Failed to export personal data');
  }
  return await res.json();
}

/**
 * Right to Erasure: DPDP Act 2023 Sec 12 & GDPR Art 17 Account Erasure
 */
export async function deleteUserAccountAPI(password, confirmation) {
  const res = await secureFetch(`${BASE_URL}/auth/delete-account`, {
    method: 'POST',
    body: JSON.stringify({ password, confirmation }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete account' }));
    throw new Error(err.detail || 'Failed to delete account');
  }
  return await res.json();
}

/**
 * Geolocation & Google Maps Store Distributor APIs
 */
export async function reverseGeocodeAPI(lat, lng) {
  const res = await secureFetch(`${BASE_URL}/geo/reverse-geocode?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  return await res.json();
}

export async function getNearbyStoresAPI(lat, lng, radius = 5000.0) {
  const res = await secureFetch(`${BASE_URL}/geo/nearby-stores?lat=${lat}&lng=${lng}&radius=${radius}`);
  if (!res.ok) throw new Error(`Nearby stores query failed: ${res.status}`);
  return await res.json();
}

export async function scrapeStoresAPI({ query = 'luxury boutique', city = '', maxResults = 8, registerNew = false }) {
  const res = await secureFetch(`${BASE_URL}/geo/scrape-stores`, {
    method: 'POST',
    body: JSON.stringify({ query, city, maxResults, registerNew })
  });
  if (!res.ok) throw new Error(`Map scrape failed: ${res.status}`);
  return await res.json();
}

/**
 * Order Tracking via Unique Order ID
 */
export async function trackOrderAPI(orderId) {
  const cleanId = encodeURIComponent((orderId || '').trim());
  const res = await secureFetch(`${BASE_URL}/orders/track/${cleanId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Order not found' }));
    throw new Error(err.detail || `Order ${orderId} not found`);
  }
  return await res.json();
}

export async function updateOrderStatusAPI(orderId, status, notes = '') {
  const cleanId = encodeURIComponent((orderId || '').trim());
  const res = await secureFetch(`${BASE_URL}/orders/track/${cleanId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes })
  });
  if (!res.ok) throw new Error(`Failed to update order status: ${res.status}`);
  return await res.json();
}

/**
 * Sendmail Protocol & Universal Customer Mail Delivery APIs
 */
export async function fetchSendmailStatusAPI() {
  const res = await secureFetch(`${BASE_URL}/mail/status`);
  if (!res.ok) throw new Error(`Failed to fetch Sendmail status: ${res.status}`);
  return await res.json();
}

/**
 * @param {{ recipient: string, offerTitle: string, discountPercent?: number, couponCode?: string, description?: string, expiryDate?: string, freeShipping?: boolean }} options
 */
export async function sendOfferEmailAPI({ recipient, offerTitle, discountPercent = 20, couponCode = 'MAISON20', description = '', expiryDate = 'Within 7 Days', freeShipping = true }) {
  const res = await secureFetch(`${BASE_URL}/mail/send-offer`, {
    method: 'POST',
    body: JSON.stringify({ recipient, offerTitle, discountPercent, couponCode, description, expiryDate, freeShipping })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send offer email' }));
    throw new Error(err.detail || 'Failed to dispatch offer email');
  }
  return await res.json();
}

/**
 * @param {{ orderId: string, recipient?: string | null }} options
 */
export async function sendOrderTrackingEmailAPI({ orderId, recipient = null }) {
  const res = await secureFetch(`${BASE_URL}/mail/send-tracking`, {
    method: 'POST',
    body: JSON.stringify({ orderId, recipient })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to dispatch order tracking email' }));
    throw new Error(err.detail || 'Failed to dispatch tracking email');
  }
  return await res.json();
}

/**
 * @param {{ recipient: string, alertTitle: string, alertMessage: string }} options
 */
export async function sendSecurityAlertEmailAPI({ recipient, alertTitle, alertMessage }) {
  const res = await secureFetch(`${BASE_URL}/mail/send-security-alert`, {
    method: 'POST',
    body: JSON.stringify({ recipient, alertTitle, alertMessage })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to dispatch security alert' }));
    throw new Error(err.detail || 'Failed to dispatch security alert');
  }
  return await res.json();
}

/**
 * @param {{ recipient: string, category?: string, token?: string | null }} options
 */
export async function sendTestMailAPI({ recipient, category = 'otp', token = null }) {
  const res = await secureFetch(`${BASE_URL}/mail/test`, {
    method: 'POST',
    body: JSON.stringify({ recipient, category, token })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send test mail' }));
    throw new Error(err.detail || 'Failed to send test mail');
  }
  return await res.json();
}

/**
 * Neon PostgreSQL Shipment, Warehouse & Local Store Tracking APIs
 */
export async function trackShipmentAPI(trackingNumberOrOrderId) {
  const cleanId = encodeURIComponent((trackingNumberOrOrderId || '').trim());
  const res = await secureFetch(`${BASE_URL}/shipments/track/${cleanId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Shipment not found' }));
    throw new Error(err.detail || `Shipment ${trackingNumberOrOrderId} not found`);
  }
  return await res.json();
}

export async function fetchWarehousesAPI() {
  const res = await secureFetch(`${BASE_URL}/shipments/warehouses`);
  if (!res.ok) throw new Error(`Failed to fetch warehouses: ${res.status}`);
  return await res.json();
}

export async function fetchLocalStoresAPI(city = '') {
  const url = city ? `${BASE_URL}/shipments/stores?city=${encodeURIComponent(city)}` : `${BASE_URL}/shipments/stores`;
  const res = await secureFetch(url);
  if (!res.ok) throw new Error(`Failed to fetch local stores: ${res.status}`);
  return await res.json();
}

export async function listShipmentsAPI(limit = 50, status = '') {
  const url = status ? `${BASE_URL}/shipments?limit=${limit}&status=${encodeURIComponent(status)}` : `${BASE_URL}/shipments?limit=${limit}`;
  const res = await secureFetch(url);
  if (!res.ok) throw new Error(`Failed to list shipments: ${res.status}`);
  return await res.json();
}

/**
 * Multi-Cloud Philanthropic & Donation Initiatives (Orphanages & Old Age Homes)
 * Integrated with Neon PostgreSQL, Cockroach Labs & Cloudinary CDN
 */

export async function fetchDonationBeneficiariesAPI(type = '') {
  const url = type ? `${BASE_URL}/donations/beneficiaries?type=${encodeURIComponent(type)}` : `${BASE_URL}/donations/beneficiaries`;
  const res = await secureFetch(url);
  if (!res.ok) throw new Error(`Failed to fetch beneficiaries: ${res.status}`);
  return await res.json();
}

export async function fetchDonationBeneficiaryAPI(beneficiaryId) {
  const res = await secureFetch(`${BASE_URL}/donations/beneficiaries/${encodeURIComponent(beneficiaryId)}`);
  if (!res.ok) throw new Error(`Beneficiary not found: ${res.status}`);
  return await res.json();
}

export async function pledgeDonationAPI(payload) {
  const res = await secureFetch(`${BASE_URL}/donations/pledge`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to record donation pledge' }));
    throw new Error(err.detail || 'Failed to record donation pledge');
  }
  return await res.json();
}

export async function fetchDonationLedgerAPI(limit = 30) {
  const res = await secureFetch(`${BASE_URL}/donations/ledger?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch philanthropic ledger: ${res.status}`);
  return await res.json();
}

export async function fetchDonationCloudStatusAPI() {
  const res = await secureFetch(`${BASE_URL}/donations/cloud-status`);
  if (!res.ok) throw new Error(`Failed to fetch donation cloud status: ${res.status}`);
  return await res.json();
}






