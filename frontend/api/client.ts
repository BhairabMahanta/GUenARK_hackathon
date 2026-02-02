import axios from "axios";
import * as SecureStore from "expo-secure-store";

/* I have set the The API base URL in 
client.ts
 is set to http://10.0.2.2:5000/api/flood (Android emulator). Update to your local IP for physical devices. */
// Use environment variable with fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ||  "https://api.masksandmachetes.com/api/flood/";
console.log("API_BASE_URL:", API_BASE_URL);
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// attach token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle 401s
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
