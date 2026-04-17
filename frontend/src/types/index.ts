export type UserRole = "admin" | "bidder";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  exp: number;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
}

export interface Artwork {
  id: number;
  title: string;
  artist_name: string;
  description: string | null;
  images: ArtworkImage[];
  starting_price: number;
  current_highest_bid: number;
  current_highest_bidder_id: number | null;
  auction_end_time: string;
  status: "active" | "closed";
  created_at: string;
}

export interface ArtworkCreateRequest {
  title: string;
  artist_name: string;
  description?: string;
  images?: ArtworkImage[];
  starting_price: number;
  auction_end_time?: string;
}

export interface ArtworkUpdateRequest {
  title?: string;
  artist_name?: string;
  description?: string | null;
  images?: ArtworkImage[];
  starting_price?: number;
  auction_end_time?: string;
  status?: "active" | "closed";
}

export interface ArtworkImage {
  url: string;
  thumbnail_url?: string | null;
}

export interface AuctionWindow {
  id: number;
  title: string;
  vip_exhibition_at: string;
  bidding_starts_at: string;
  bidding_ends_at: string;
  closed_at: string | null;
  phase: "upcoming" | "live" | "ended" | "closed";
  countdown_target: string | null;
  is_live: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuctionWindowUpdateRequest {
  title?: string;
  vip_exhibition_at?: string;
  bidding_starts_at?: string;
  bidding_ends_at?: string;
}

export interface Bid {
  id: number;
  user_id: number;
  artwork_id: number;
  amount: number;
  timestamp: string;
}

export interface PlaceBidRequest {
  amount: number;
}

export interface AdminBid {
  id: number;
  user_id: number;
  user_email: string | null;
  artwork_id: number;
  artwork_title: string | null;
  amount: number;
  timestamp: string;
}

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export type ArtworkStatusFilter = "all" | "active" | "closed";
