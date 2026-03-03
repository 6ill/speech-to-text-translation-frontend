import axios from "axios";
import { clearAuthStorage, tokenStorage } from "./auth";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: attach JWT token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = tokenStorage.get();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor: handle 401 Unauthorized globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuthStorage();
            if (window.location.pathname !== "/auth") {
                window.location.href = "/auth";
            }
        }
        return Promise.reject(error);
    },
);

export default apiClient;
