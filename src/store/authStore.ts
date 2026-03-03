import { create } from "zustand";
import {
    clearAuthStorage,
    StoredUser,
    tokenStorage,
    userStorage,
} from "@/lib/auth";

interface AuthState {
    token: string | null;
    user: StoredUser | null;
    isAuthenticated: boolean;

    // Actions
    setAuth: (token: string, user: StoredUser) => void;
    logout: () => void;
}

// Read localStorage SYNCHRONOUSLY at module load time,
// before any component renders. This prevents the race condition
// where ProtectedRoute renders before useEffect can rehydrate state.

const persistedToken = tokenStorage.get();
const persistedUser = userStorage.get();

export const useAuthStore = create<AuthState>(() => ({
    token: persistedToken,
    user: persistedUser,
    isAuthenticated: !!(persistedToken && persistedUser),

    setAuth: (token, user) => {
        tokenStorage.set(token);
        userStorage.set(user);
        useAuthStore.setState({ token, user, isAuthenticated: true });
    },

    logout: () => {
        clearAuthStorage();
        useAuthStore.setState({
            token: null,
            user: null,
            isAuthenticated: false,
        });
    },
}));
