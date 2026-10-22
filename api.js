/**
 * ==========================================================================
 * EXPRESSIVE MODEL MAKING CO. — FRONTEND DUAL-API CONNECTOR
 * ==========================================================================
 * Supports TWO separate Google Spreadsheets & Apps Scripts:
 *  1. Admin Backend (Auth, Inquiries, Feedback, Analytics, Workers)
 *  2. Gallery Backend (Categories, Projects, Drive Media)
 * Fallback to local storage if endpoints are not configured or offline.
 */

const API = (function () {
  const DEFAULT_ADMIN_URL = 'https://script.google.com/macros/s/AKfycbw5FqBE9m1DEnZCrK-9z762Dyd3FxnBmcZJ_j8hSx3_DI5KWXCQFTKTYly6XGFhVm9FQA/exec';
  const DEFAULT_GALLERY_URL = 'https://script.google.com/macros/s/AKfycbzoqjsSXDjIVS2sOW3yWiM1eeBl6FANSQBlfSJVZrWqT_VjANaEDPI4OnaDDWCLdwy0/exec';
  
  const memoryStore = {};
  function safeStorageGet(key) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
      return memoryStore[key] || null;
    } catch (e) {
      return memoryStore[key] || null;
    }
  }

  function safeStorageSet(key, val) {
    memoryStore[key] = val;
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  // Auto-upgrade stored URLs to current production endpoints
  let storedAdmin = safeStorageGet('emm_admin_script_url') || safeStorageGet('emm_script_url');
  if (!storedAdmin || storedAdmin !== DEFAULT_ADMIN_URL) {
    storedAdmin = DEFAULT_ADMIN_URL;
    safeStorageSet('emm_admin_script_url', DEFAULT_ADMIN_URL);
    safeStorageSet('emm_script_url', DEFAULT_ADMIN_URL);
  }

  let storedGallery = safeStorageGet('emm_gallery_script_url');
  if (!storedGallery || storedGallery !== DEFAULT_GALLERY_URL) {
    storedGallery = DEFAULT_GALLERY_URL;
    safeStorageSet('emm_gallery_script_url', DEFAULT_GALLERY_URL);
  }

  let adminScriptUrl = storedAdmin || DEFAULT_ADMIN_URL;
  let galleryScriptUrl = storedGallery || DEFAULT_GALLERY_URL;

  const SESSION_KEY = 'emm_admin_session';

  const GALLERY_ACTIONS = [
    'get_public_gallery',
    'get_admin_gallery',
    'get_gallery',
    'create_category',
    'update_category',
    'delete_category',
    'upload_project_media',
    'delete_project_media'
  ];

  function getTargetUrl(action) {
    if (GALLERY_ACTIONS.indexOf(action) !== -1 && galleryScriptUrl) {
      return galleryScriptUrl;
    }
    return adminScriptUrl;
  }

  async function makeRequest(data, method = 'POST') {
    const action = data.action || '';
    const targetUrl = getTargetUrl(action);

    if (!targetUrl) {
      console.warn("Backend Script URL is not set yet.");
      return { status: 'error', message: 'Backend URL not configured.' };
    }

    // Set intelligent timeout: uploads get 25s, quick actions get 4.5s
    const isUpload = action === 'upload_project_media' || action === 'upload_avatar';
    const timeoutMs = isUpload ? 25000 : 4500;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (method === 'GET') {
        const query = new URLSearchParams(data).toString();
        const response = await fetch(`${targetUrl}?${query}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return await response.json();
      } else {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return await response.json();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const isAbort = error.name === 'AbortError';
      console.warn(`API note [${action}] (${isAbort ? 'Timeout after ' + timeoutMs + 'ms' : error.message})`);
      return { status: 'error', isTimeout: isAbort, message: isAbort ? 'Network timeout' : error.message };
    }
  }

  return {
    getAdminUrl: () => adminScriptUrl,
    setAdminUrl: (url) => {
      if (url && url.trim()) {
        adminScriptUrl = url.trim();
        safeStorageSet('emm_admin_script_url', adminScriptUrl);
      }
    },
    getGalleryUrl: () => galleryScriptUrl,
    setGalleryUrl: (url) => {
      if (url && url.trim()) {
        galleryScriptUrl = url.trim();
        safeStorageSet('emm_gallery_script_url', galleryScriptUrl);
      }
    },
    getScriptUrl: () => adminScriptUrl,
    setScriptUrl: (url) => {
      if (url && url.trim()) {
        adminScriptUrl = url.trim();
        safeStorageSet('emm_admin_script_url', adminScriptUrl);
        safeStorageSet('emm_script_url', adminScriptUrl);
      }
    },
    request: makeRequest,
    getSession: () => {
      const s = safeStorageGet(SESSION_KEY);
      try {
        return s ? JSON.parse(s) : null;
      } catch (e) {
        return null;
      }
    },
    setSession: (sess) => {
      try {
        safeStorageSet(SESSION_KEY, JSON.stringify(sess));
      } catch (e) {}
    },
    clearSession: () => {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (e) {}
    }
  };
})();
