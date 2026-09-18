export type User = { id: string; email: string };
export type Memory = {
  id: string;
  petId: string;
  title: string;
  date: string | null;
  text: string;
  photoUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};
export type MemoryInput = {
  title: string;
  date: string | null;
  text: string;
  photoUrl: string | null;
};
export type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  bio: string | null;
  birthday: string | null;
  avatarUrl: string | null;
  arrivalDate: string | null;
  gender: string | null;
  weight: string | null;
  coat: string | null;
  likes: string | null;
  tags: string[];
  quote: string | null;
  quoteAuthor: string | null;
  slug: string;
  isPublished: boolean;
  viewCount: number;
  memories?: Memory[];
};
const base = import.meta.env.VITE_API_BASE || "/api";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(base + path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "请求失败，请稍后再试");
  return payload?.data ?? payload;
}
export const api = {
  me: () => request<{ user: User | null }>("/auth/me"),
  login: (email: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, birthday?: string) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        birthday: birthday || undefined,
      }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  pets: () => request<Pet[]>("/pets"),
  pet: (id: string) => request<Pet>(`/pets/${id}`),
  createPet: (data: Partial<Pet>) =>
    request<Pet>("/pets", { method: "POST", body: JSON.stringify(data) }),
  updatePet: (id: string, data: Partial<Pet>) =>
    request<Pet>(`/pets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  uploadPetImage: async (id: string, file: File, kind: "avatar" | "memory") => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const response = await fetch(`${base}/pets/${id}/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(payload?.error || "图片上传失败，请稍后再试");
    return (payload?.data ?? payload) as { url: string };
  },
  deleteMemory: (id: string, memoryId: string) =>
    request<void>(`/pets/${id}/memories/${memoryId}`, { method: "DELETE" }),
  memories: (id: string) => request<Memory[]>(`/pets/${id}/memories`),
  createMemory: (id: string, data: MemoryInput) =>
    request<Memory>(`/pets/${id}/memories`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMemory: (id: string, memoryId: string, data: Partial<MemoryInput>) =>
    request<Memory>(`/pets/${id}/memories/${memoryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  sharing: (
    id: string,
    data: { isPublished: boolean },
  ) =>
    request<Pet>(`/pets/${id}/sharing`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  publicPet: (slug: string) =>
    request<Pet>(`/public/pets/${encodeURIComponent(slug)}`),
  unlock: (slug: string, password: string) =>
    request<Pet>(`/public/pets/${encodeURIComponent(slug)}/unlock`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};
