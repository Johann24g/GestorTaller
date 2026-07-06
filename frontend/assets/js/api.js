
const API_BASE = "http://localhost:3002/api";

function getToken() {
    return localStorage.getItem("token");
}

async function login(usuario, contrasena) {
    const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ Usuario: usuario, Contrasena: contrasena })
    });
    localStorage.setItem("token", data.token);
    return data.empleado;
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("empleado");
    window.location.href = "login.html";
}


function requireLogin() {
    if (!getToken()) {
        window.location.href = "login.html";
    }
}

function getEmpleadoActual() {
    const raw = localStorage.getItem("empleado");
    return raw ? JSON.parse(raw) : null;
}

async function apiRequest(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...options
    });
    if (res.status === 401) {
        logout(); 
        throw new Error("Sesion expirada, inicia sesion de nuevo");
    }
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
