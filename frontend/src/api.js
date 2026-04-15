const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("medical_platform_token");
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "请求失败");
  }

  return payload;
}

export const api = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    }),
  getUsers: () => request("/users"),
  getImages: (filters = {}) => {
    const query = new URLSearchParams();

    if (filters.patientId) {
      query.set("patientId", filters.patientId);
    }

    if (filters.studyDate) {
      query.set("studyDate", filters.studyDate);
    }

    return request(`/images${query.toString() ? `?${query.toString()}` : ""}`);
  },
  uploadImage: (formData) =>
    request("/images", {
      method: "POST",
      body: formData
    }),
  deleteImage: (id) =>
    request(`/images/${id}`, {
      method: "DELETE"
    })
};
