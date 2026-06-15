import AsyncStorage from "@react-native-async-storage/async-storage";

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api/v1`;
  return "http://localhost:8080/api/v1";
}

async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem("accessToken");
}

async function refreshTokens(): Promise<string | null> {
  try {
    const rt = await AsyncStorage.getItem("refreshToken");
    if (!rt) return null;
    const res = await fetch(`${getBaseUrl()}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const { accessToken, refreshToken } = data.data;
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false
): Promise<{ data: T }> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshTokens();
    if (newToken) {
      return request(method, path, body, true);
    }
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    throw new Error("SESSION_EXPIRED");
  }

  const data = await res.json();
  if (!res.ok) throw { response: { data, status: res.status } };
  return { data };
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export const authAPI = {
  register: (data: any) => request("POST", "/auth/register", data),
  login: (data: any) => request("POST", "/auth/login", data),
  logout: (refreshToken: string) => request("POST", "/auth/logout", { refreshToken }),
  forgotPassword: (email: string) => request("POST", "/auth/forgot-password", { email }),
};

export const usersAPI = {
  getProfile: () => request("GET", "/users/profile"),
  updateProfile: (data: any) => request("PATCH", "/users/profile", data),
  changePassword: (data: any) => request("POST", "/users/change-password", data),
};

export const walletsAPI = {
  getWallets: () => request("GET", "/wallets"),
  getPortfolio: () => request("GET", "/wallets/portfolio"),
  getWallet: (currency: string) => request("GET", `/wallets/${currency}`),
};

export const tradingAPI = {
  getQuote: (params: any) => request("GET", `/trading/quote${buildQuery(params)}`),
  buy: (data: any) => request("POST", "/trading/buy", data),
  sell: (data: any) => request("POST", "/trading/sell", data),
  getHistory: (params?: any) => request("GET", `/trading/history${buildQuery(params)}`),
};

export const swapAPI = {
  getQuote: (params: any) => request("GET", `/swap/quote${buildQuery(params)}`),
  execute: (data: any) => request("POST", "/swap", data),
  getHistory: (params?: any) => request("GET", `/swap/history${buildQuery(params)}`),
};

export const transactionsAPI = {
  getAll: (params?: any) => request("GET", `/transactions${buildQuery(params)}`),
};

export const paymentsAPI = {
  mobileMoneyDeposit: (data: any) => request("POST", "/payments/mobile-money/deposit", data),
  mobileMoneyWithdrawal: (data: any) => request("POST", "/payments/mobile-money/withdrawal", data),
};

export const pricesAPI = {
  getPrices: () => request("GET", "/prices"),
  getChart: (currency: string, days?: number) =>
    request("GET", `/prices/chart/${currency}${buildQuery({ days })}`),
};

export const kycAPI = {
  getStatus: () => request("GET", "/kyc/status"),
};

export const supportAPI = {
  getTickets: () => request("GET", "/support"),
  createTicket: (data: any) => request("POST", "/support", data),
  getTicket: (id: string) => request("GET", `/support/${id}`),
  reply: (id: string, message: string) => request("POST", `/support/${id}/reply`, { message }),
};
