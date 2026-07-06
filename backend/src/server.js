const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const clientesRoutes = require("./routes/clientes.routes");
const empleadosRoutes = require("./routes/empleados.routes");
const ordenesRoutes = require("./routes/ordenes.routes");
const piezasRoutes = require("./routes/piezas.routes");
const reparacionesRoutes = require("./routes/reparaciones.routes");
const { requireAuth } = require("./middleware/auth");

const app = express();

app.use(cors()); 
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));


app.use("/api/auth", authRoutes);


app.use("/api/clientes", requireAuth, clientesRoutes);
app.use("/api/empleados", requireAuth, empleadosRoutes);
app.use("/api/ordenes", requireAuth, ordenesRoutes);
app.use("/api/piezas", requireAuth, piezasRoutes);
app.use("/api/reparaciones", requireAuth, reparacionesRoutes);


app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
});
