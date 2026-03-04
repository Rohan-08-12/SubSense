const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://subsense.onrender.com/api";

export async function apiCall(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await res.json();
    if (!res.ok) {
        const errorMsg = data.error || data.message || "Request failed";
        throw new Error(errorMsg);
    }
    return data;
}
