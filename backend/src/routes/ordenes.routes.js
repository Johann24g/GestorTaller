const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");

// GET /api/ordenes -> lista con nombre del cliente incluido
router.get("/", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT o.ID_Orden, o.ID_Cliente, o.Dispositivo, o.Descripcion, o.FechaRecibo,
                   c.Nombre AS ClienteNombre, c.Apellido AS ClienteApellido
            FROM Ordenes o
            INNER JOIN Clientes c ON c.ID_Cliente = o.ID_Cliente
            ORDER BY o.ID_Orden DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ordenes/:id
router.get("/:id", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT o.ID_Orden, o.ID_Cliente, o.Dispositivo, o.Descripcion, o.FechaRecibo,
                       c.Nombre AS ClienteNombre, c.Apellido AS ClienteApellido
                FROM Ordenes o
                INNER JOIN Clientes c ON c.ID_Cliente = o.ID_Cliente
                WHERE o.ID_Orden = @id
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ordenes
router.post("/", async (req, res) => {
    try {
        const { ID_Cliente, Dispositivo, Descripcion } = req.body;
        if (!ID_Cliente || !Dispositivo) {
            return res.status(400).json({ error: "ID_Cliente y Dispositivo son obligatorios" });
        }
        const pool = await getPool();
        const result = await pool.request()
            .input("ID_Cliente", sql.Int, ID_Cliente)
            .input("Dispositivo", sql.VarChar(100), Dispositivo)
            .input("Descripcion", sql.VarChar(200), Descripcion || null)
            .query(`INSERT INTO Ordenes (ID_Cliente, Dispositivo, Descripcion)
                    OUTPUT INSERTED.*
                    VALUES (@ID_Cliente, @Dispositivo, @Descripcion)`);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        if (err.number === 547) {
            return res.status(400).json({ error: "El cliente indicado no existe" });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/ordenes/:id
router.put("/:id", async (req, res) => {
    try {
        const { ID_Cliente, Dispositivo, Descripcion } = req.body;
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .input("ID_Cliente", sql.Int, ID_Cliente)
            .input("Dispositivo", sql.VarChar(100), Dispositivo)
            .input("Descripcion", sql.VarChar(200), Descripcion || null)
            .query(`UPDATE Ordenes SET
                        ID_Cliente = @ID_Cliente,
                        Dispositivo = @Dispositivo,
                        Descripcion = @Descripcion
                    OUTPUT INSERTED.*
                    WHERE ID_Orden = @id`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/ordenes/:id
router.delete("/:id", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM Ordenes WHERE ID_Orden = @id");
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }
        res.status(204).send();
    } catch (err) {
        if (err.number === 547) {
            return res.status(409).json({ error: "No se puede eliminar: la orden tiene una reparacion asociada" });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
