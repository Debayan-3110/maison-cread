import { User, Product, Order, APIResponse, AuthResponse } from '../types/models';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

async function secureFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Add CSRF token from cookie if present
    const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('X-CSRF-Token='))
        ?.split('=')[1];
    
    if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Handle token refresh logic here
        console.error('Unauthorized access - token may be expired');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API Request failed');
    }

    return response.json();
}

export const api = {
    auth: {
        login: (data: any) => secureFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }),
        getMe: () => secureFetch<User>('/auth/me'),
        logout: () => secureFetch<APIResponse<void>>('/auth/logout', {
            method: 'POST'
        }),
    },
    products: {
        getAll: (params: any) => {
            const query = new URLSearchParams(params).toString();
            return secureFetch<APIResponse<Product[]>>(`/products?${query}`);
        },
        getOne: (id: number) => secureFetch<Product>(`/products/${id}`),
    },
    orders: {
        create: (order: any) => secureFetch<Order>('/orders/', {
            method: 'POST',
            body: JSON.stringify(order),
            headers: { 'Content-Type': 'application/json' }
        }),
        list: () => secureFetch<Order[]>('/orders/'),
    }
};
