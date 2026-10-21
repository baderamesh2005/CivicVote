const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('civic_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(API_BASE + endpoint, config);
    
    // Handle binary responses (e.g. CSV download)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      return { ok: true, blob };
    }

    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      if (res.status === 401 && token) {
        localStorage.removeItem('civic_auth_token');
        localStorage.removeItem('civic_auth_user');
        window.dispatchEvent(new Event('auth-session-expired'));
      }
      return {
        ok: false,
        status: res.status,
        error: data.error || 'A network error occurred. Please try again.',
        code: data.code,
        data,
      };
    }

    return {
      ok: true,
      status: res.status,
      ...data,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message || 'Network communication failure. Please verify backend is running.',
    };
  }
}
