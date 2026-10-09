import axios from 'axios';

// In local development keep the same hostname as the UI. Cookies are scoped by
// hostname, so `127.0.0.1` and `localhost` cannot share the HttpOnly session.
const localApiUrl = typeof window === 'undefined'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;
const apiUrl = new URL(import.meta.env.VITE_API_URL || localApiUrl);
const localHosts = ['localhost', '127.0.0.1'];
if (typeof window !== 'undefined' && localHosts.includes(window.location.hostname) && localHosts.includes(apiUrl.hostname)) {
  apiUrl.hostname = window.location.hostname;
}
const API_URL = apiUrl.toString().replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

export const getApiErrorMessage = (error: unknown, fallback = 'Não foi possível concluir a operação. Tente novamente.') => {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback;

  const status = error.response?.status;
  if (!error.response) return 'Não foi possível conectar ao servidor. Tente novamente.';

  const serverMessage = (error.response.data as { message?: unknown } | undefined)?.message;
  if (status === 409 && typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage;
  }

  switch (status) {
    case 400:
    case 422:
      return 'Verifique os dados informados e tente novamente.';
    case 401:
      return error.config?.url?.includes('/auth/login')
        ? 'E-mail ou senha inválidos, ou cadastro ainda não aprovado.'
        : 'Sua sessão expirou. Entre novamente para continuar.';
    case 403:
      return 'Você não tem permissão para realizar esta ação.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'Já existe um cadastro com esses dados.';
    case 429:
      return 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.';
    case 500:
    case 502:
    case 503:
      return 'Não foi possível concluir a operação agora. Tente novamente mais tarde.';
    default:
      return fallback;
  }
};

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('sam:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
