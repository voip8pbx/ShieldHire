import { ENV } from '../config/env';

const MACHINE_IP = ENV.MACHINE_IP;
const DEVELOPMENT_URL = ENV.DEV_BASE_URL;
const PRODUCTION_URL = ENV.PROD_BASE_URL;

export const BASE_URL = __DEV__ ? DEVELOPMENT_URL : PRODUCTION_URL;

console.log(`[API] Using Base URL: ${BASE_URL}`);

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

const getHeaders = (customHeaders: any = {}) => {
    const headers: any = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = text;
    }

    if (!response.ok) {
        const error: any = new Error(data?.error || response.statusText || 'Network Error');
        error.response = {
            data: typeof data === 'object' ? data : { error: data },
            status: response.status,
        };
        throw error;
    }
    return { data };
};

// Timeout helper (Increased to 60s for mobile networks)
const fetchWithTimeout = (url: string, options: any, timeout = 60000) => {
    console.log(`[API] Requesting: ${url}`);
    return Promise.race([
        fetch(url, options),
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
    ]);
};

const api = {
    get: async <T = any>(url: string, config: any = {}) => {
        const query = config.params
            ? '?' + new URLSearchParams(config.params).toString()
            : '';
        const response = await fetchWithTimeout(`${BASE_URL}${url}${query}`, {
            method: 'GET',
            headers: getHeaders(config.headers),
        });
        return handleResponse(response) as Promise<{ data: T }>;
    },
    post: async <T = any>(url: string, body: any, config: any = {}) => {
        const response = await fetchWithTimeout(`${BASE_URL}${url}`, {
            method: 'POST',
            headers: getHeaders(config.headers),
            body: JSON.stringify(body),
        });
        return handleResponse(response) as Promise<{ data: T }>;
    },
    put: async <T = any>(url: string, body: any, config: any = {}) => {
        const response = await fetchWithTimeout(`${BASE_URL}${url}`, {
            method: 'PUT',
            headers: getHeaders(config.headers),
            body: JSON.stringify(body),
        });
        return handleResponse(response) as Promise<{ data: T }>;
    },
    patch: async <T = any>(url: string, body: any, config: any = {}) => {
        const response = await fetchWithTimeout(`${BASE_URL}${url}`, {
            method: 'PATCH',
            headers: getHeaders(config.headers),
            body: JSON.stringify(body),
        });
        return handleResponse(response) as Promise<{ data: T }>;
    },
};

export default api;
