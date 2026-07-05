const express = require("express");
const cors = require("cors");
require("dotenv").config();

const clientesRoutes = require("./routes/clientes.routes");
const empleadosRoutes = require("./routes/empleados.routes");
const ordenesRoutes = require("./routes/ordenes.routes");
const piezasRoutes = require("./routes/piezas.routes");
const reparacionesRoutes = require("./routes/reparaciones.routes");

const app = express();

app.use(cors()); // abierto para desarrollo local; restringir origenes en produccion
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/clientes", clientesRoutes);
app.use("/api/empleados", empleadosRoutes);
app.use("/api/ordenes", ordenesRoutes);
app.use("/api/piezas", piezasRoutes);
app.use("/api/reparaciones", reparacionesRoutes);

// Manejador de errores no capturados
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
});
