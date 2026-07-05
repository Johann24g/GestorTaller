
const API_BASE = "http://localhost:3002/api";

async function apiRequest(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options
    });
    let body = null;
    const text = await res.text();
    if (text) {
        try { body = JSON.parse(text); } catch { body = text; }
    }
    if (!res.ok) {
        const message = (body && body.error) ? body.error : `Error ${res.status}`;
        throw new Error(message);
    }
    return body;
}

const api = {
    get: (path) => apiRequest(path),
    post: (path, data) => apiRequest(path, { method: "POST", body: JSON.stringify(data) }),
    put: (path, data) => apiRequest(path, { method: "PUT", body: JSON.stringify(data) }),
    delete: (path) => apiRequest(path, { method: "DELETE" })
};

function formatFecha(fechaStr) {
    if (!fechaStr) return "—";
    const d = new Date(fechaStr);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("es-DO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mostrarError(err) {
    alert("Ocurrió un error: " + err.message);
    console.error(err);
}
