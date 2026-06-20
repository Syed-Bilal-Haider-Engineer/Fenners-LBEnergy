import axios from "axios";
export const api = axios.create({
  baseURL: "http://127.0.0.1:8000" || process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true
});