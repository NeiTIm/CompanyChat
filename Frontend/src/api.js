import axios from "axios";

export const API_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
// import axios from "axios";

// export const API_URL =
//   // export const API_URL = "https://URL-NGROK-BACKEND-CUA-BAN.ngrok-free.app";
//   "https://13ca-2405-4803-caee-e390-428f-940f-4f9d-eeb6.ngrok-free.app";

// const api = axios.create({
//   baseURL: `${API_URL}/api`,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;
