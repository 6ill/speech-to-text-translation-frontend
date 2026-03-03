const TOKEN_KEY = "access_token";
const USER_KEY = "auth_user";

export interface StoredUser {
    email: string;
    name: string;
    role: "user" | "admin";
}

export const tokenStorage = {
    get: (): string | null => localStorage.getItem(TOKEN_KEY),
    set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
    remove: (): void => localStorage.removeItem(TOKEN_KEY),
};

export const userStorage = {
    get: (): StoredUser | null => {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as StoredUser;
        } catch {
            return null;
        }
    },
    set: (user: StoredUser): void =>
        localStorage.setItem(USER_KEY, JSON.stringify(user)),
    remove: (): void => localStorage.removeItem(USER_KEY),
};

export const clearAuthStorage = (): void => {
    tokenStorage.remove();
    userStorage.remove();
};
