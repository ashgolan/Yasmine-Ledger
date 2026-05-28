import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.PROD ? "/api" : "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url = err.config?.url || "";
      if (
        !url.includes("/auth/login") &&
        !url.includes("/auth/check-setup") &&
        !url.includes("/auth/me")
      ) {
        document.cookie.split(";").forEach(c => {
          document.cookie = c.trim().split("=")[0] +
            "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
        });
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);
