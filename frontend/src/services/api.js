const BASE_URL = '/api';

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

export async function fetchProducts({ limit = 50, skip = 0, category = '', search = '', sortBy = '', order = '', maxPrice = null } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('skip', skip);
    if (category) params.append('category', category);
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
    return ['all', 'smartphones', 'laptops', 'mobile-accessories', 'mens-watches', 'womens-jewellery', 'beauty', 'fragrances', 'furniture'];
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
