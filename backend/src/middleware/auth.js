const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
    const header = req.headers.authorization; 
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Falta el token de autenticacion" });
    }

    const token = header.slice("Bearer ".length);
    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token invalido o expirado" });
    }
}


function requireRole(...cargosPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !cargosPermitidos.includes(req.usuario.cargo)) {
            return res.status(403).json({ error: "No tienes permiso para realizar esta accion" });
        }
        next();
    };
}

module.exports = { requireAuth, requireRole };
