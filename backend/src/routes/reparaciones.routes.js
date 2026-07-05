const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");

// GET /api/reparaciones -> con datos de cliente, empleado y orden
router.get("/", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT r.ID_Orden, r.ID_Cliente, r.ID_Empleado, r.Estado, r.Insumos,
                   o.Dispositivo, c.Nombre AS ClienteNombre, c.Apellido AS ClienteApellido,
                   e.Nombre AS EmpleadoNombre, e.Apellido AS EmpleadoApellido
            FROM Reparaciones r
            INNER JOIN Ordenes o ON o.ID_Orden = r.ID_Orden
            INNER JOIN Clientes c ON c.ID_Cliente = r.ID_Cliente
            INNER JOIN Empleados e ON e.ID_Empleado = r.ID_Empleado
            ORDER BY r.ID_Orden DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reparaciones/:idOrden
router.get("/:idOrden", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.idOrden)
            .query("SELECT * FROM Reparaciones WHERE ID_Orden = @id");
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Reparacion no encontrada" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reparaciones
router.post("/", async (req, res) => {
    try {
        const { ID_Orden, ID_Cliente, ID_Empleado, Estado, Insumos } = req.body;
        if (!ID_Orden || !ID_Cliente || !ID_Empleado) {
            return res.status(400).json({ error: "ID_Orden, ID_Cliente e ID_Empleado son obligatorios" });
        }
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Orden", sql.Int, ID_Orden)
            .input("ID_Cliente", sql.Int, ID_Cliente)
            .input("ID_Empleado", sql.Int, ID_Empleado)
            .input("Estado", sql.VarChar(20), Estado || "Pendiente")
            .input("Insumos", sql.VarChar(sql.MAX), Insumos || null)
            .query(`INSERT INTO Reparaciones (ID_Orden, ID_Cliente, ID_Empleado, Estado, Insumos)
                    OUTPUT INSERTED.*
                    VALUES (@ID_Orden, @ID_Cliente, @ID_Empleado, @Estado, @Insumos)`);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        if (err.number === 2627) {
            return res.status(409).json({ error: "Esa orden ya tiene una reparacion registrada" });
        }
        if (err.number === 547) {
            return res.status(400).json({ error: "Orden, cliente o empleado no existen" });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/reparaciones/:idOrden -> normalmente para cambiar Estado / Insumos
router.put("/:idOrden", async (req, res) => {
    try {
        const { ID_Empleado, Estado, Insumos } = req.body;
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.idOrden)
            .input("ID_Empleado", sql.Int, ID_Empleado)
            .input("Estado", sql.VarChar(20), Estado)
            .input("Insumos", sql.VarChar(sql.MAX), Insumos || null)
            .query(`UPDATE Reparaciones SET
                        ID_Empleado = @ID_Empleado,
                        Estado = @Estado,
                        Insumos = @Insumos
                    OUTPUT INSERTED.*
                    WHERE ID_Orden = @id`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Reparacion no encontrada" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/reparaciones/:idOrden
router.delete("/:idOrden", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.idOrden)
            .query("DELETE FROM Reparaciones WHERE ID_Orden = @id");
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Reparacion no encontrada" });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
