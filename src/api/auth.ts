/**
 *
 * NOTE: Role is NOT in the JWT — we must call /auth/me after login to get it.
 */
import apiClient from "@/lib/axios";
import { StoredUser } from "@/lib/auth";


export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    data: {
        access_token: string;
        refresh_token: string;
        user: {
            email: string;
            id: string;
        };
    };
}

export interface MeResponse {
    id: string;
    email: string;
    role: "user" | "admin";
    created_at: string;
    files: unknown[];
}


/**
 * POST /auth/signin
 * Backend expects JSON body { email, password }.
 */
export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/signin", data);
    return response.data;
}

/**
 * POST /auth/signup
 * Backend expects JSON body { email, password }.
 */
export async function registerApi(data: RegisterRequest): Promise<void> {
    await apiClient.post("/auth/signup", data);
}

/**
 * GET /auth/me
 * Fetch current user's full profile including role.
 * Called after login to get role info (not in JWT payload).
 */
export async function getMeApi(): Promise<MeResponse> {
    const response = await apiClient.get<MeResponse>("/auth/me");
    return response.data;
}

/**
 * GET /auth/signout
 * Invalidates the current JWT (adds jti to Redis blocklist).
 */
export async function logoutApi(): Promise<void> {
    await apiClient.get("/auth/signout");
}

/**
 * Build a StoredUser from login + /me response.
 */
export function buildStoredUser(
    email: string,
    role: "user" | "admin",
): StoredUser {
    return {
        email,
        name: email.split("@")[0],
        role,
    };
}
