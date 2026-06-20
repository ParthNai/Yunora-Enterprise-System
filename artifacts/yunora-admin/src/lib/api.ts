export const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export const apiFetch = (path: string, init?: RequestInit): Promise<Response> => {
  return fetch(getApiUrl(path), init);
};
