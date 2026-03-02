import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true, // B2B uses httpOnly cookies (not localStorage tokens)
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function photoUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) {
    const m = path.match(/\/([^/?#]+)(?:\?|#|$)/);
    const filename = m ? m[1] : null;
    if (filename) {
      return `${import.meta.env.VITE_API_URL}/api/media/${encodeURIComponent(filename)}`;
    }
  }
  return `${import.meta.env.VITE_API_URL}${path}`;
}

export default api;
