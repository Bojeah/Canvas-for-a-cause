import axios, { AxiosError } from "axios";

import type {
  AuctionWindow,
  AuctionWindowUpdateRequest,
  AdminBid,
  Artwork,
  ArtworkCreateRequest,
  ArtworkUpdateRequest,
  AuthResponse,
  Bid,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types";
import { extractApiErrorDetail, mapErrorMessage } from "./errorMapper";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let unauthorizedHandler: (() => void) | null = null;
let authToken: string | null =
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("pausc_auth_token")
    : null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Enable sending HTTP-only cookies with requests
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return mapErrorMessage("network");
    }

    const detail = extractApiErrorDetail(error.response.data);
    if (detail) {
      return mapErrorMessage(detail);
    }
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return mapErrorMessage(error.message);
  }

  return fallback;
};

export const authApi = {
  register: async (payload: RegisterRequest) => {
    const { data } = await api.post<User>("/register", payload);
    return data;
  },
  login: async (payload: LoginRequest) => {
    const { data } = await api.post<AuthResponse>("/login", payload);
    return data;
  },
  adminLogin: async (payload: LoginRequest) => {
    const { data } = await api.post<AuthResponse>("/admin/login", payload);
    return data;
  },
  logout: async () => {
    await api.post("/logout");
  },
};

export const artworksApi = {
  list: async () => {
    const { data } = await api.get<Artwork[]>("/artworks");
    return data;
  },
  getById: async (id: number, signal?: AbortSignal) => {
    const { data } = await api.get<Artwork>(`/artworks/${id}`, { signal });
    return data;
  },
};

export const auctionApi = {
  getWindow: async () => {
    const { data } = await api.get<AuctionWindow>("/auction-window");
    return data;
  },
};

export const bidsApi = {
  place: async (artworkId: number, amount: number) => {
    const { data } = await api.post<Bid>(`/artworks/${artworkId}/bid`, {
      amount,
    });
    return data;
  },
};

export const adminApi = {
  getAuctionWindow: async () => {
    const { data } = await api.get<AuctionWindow>("/admin/auction-window");
    return data;
  },
  updateAuctionWindow: async (payload: AuctionWindowUpdateRequest) => {
    const { data } = await api.put<AuctionWindow>(
      "/admin/auction-window",
      payload,
    );
    return data;
  },
  closeAuctionWindow: async () => {
    const { data } = await api.post<AuctionWindow>(
      "/admin/auction-window/close",
    );
    return data;
  },
  createArtwork: async (payload: ArtworkCreateRequest) => {
    const { data } = await api.post<Artwork>("/admin/artworks", payload);
    return data;
  },
  updateArtwork: async (id: number, payload: ArtworkUpdateRequest) => {
    const { data } = await api.patch<Artwork>(`/admin/artworks/${id}`, payload);
    return data;
  },
  deleteArtwork: async (id: number) => {
    await api.delete(`/admin/artworks/${id}`);
  },
  listBids: async () => {
    const { data } = await api.get<AdminBid[]>("/admin/bids");
    return data;
  },
  closeAuction: async (id: number) => {
    const { data } = await api.post<Artwork>(`/admin/close-auction/${id}`);
    return data;
  },
};

export default api;
