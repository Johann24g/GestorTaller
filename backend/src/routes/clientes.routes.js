const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");


router.get("/", async (req, res) => {
    try {
        const pool = await getPool();
        const { q } = req.query;
        let query = "SELECT * FROM Clientes";
        const request = pool.request();
        if (q) {
            query += " WHERE Nombre LIKE @q OR Apellido LIKE @q OR Cedula LIKE @q";
            request.input("q", sql.VarChar, `%${q}%`);
        }
        query += " ORDER BY ID_Cliente DESC";
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("SELECT * FROM Clientes WHERE ID_Cliente = @id");
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post("/", async (req, res) => {
    try {
        const { Nombre, Apellido, Cedula, Correo, Telefono, Direccion } = req.body;
        if (!Nombre || !Apellido || !Cedula) {
            return res.status(400).json({ error: "Nombre, Apellido y Cedula son obligatorios" });
        }
        const pool = await getPool();
        const result = await pool.request()
            .input("Nombre", sql.VarChar(50), Nombre)
            .input("Apellido", sql.VarChar(50), Apellido)
            .input("Cedula", sql.VarChar(20), Cedula)
            .input("Correo", sql.VarChar(100), Correo || null)
            .input("Telefono", sql.VarChar(20), Telefono || null)
            .input("Direccion", sql.VarChar(200), Direccion || null)
            .query(`INSERT INTO Clientes (Nombre, Apellido, Cedula, Correo, Telefono, Direccion)
                    OUTPUT INSERTED.*
                    VALUES (@Nombre, @Apellido, @Cedula, @Correo, @Telefono, @Direccion)`);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: "Ya existe un cliente con esa cedula" });
        }
        res.status(500).json({ error: err.message });
    }
});


router.put("/:id", async (req, res) => {
    try {
        const { Nombre, Apellido, Cedula, Correo, Telefono, Direccion } = req.body;
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .input("Nombre", sql.VarChar(50), Nombre)
            .input("Apellido", sql.VarChar(50), Apellido)
            .input("Cedula", sql.VarChar(20), Cedula)
            .input("Correo", sql.VarChar(100), Correo || null)
            .input("Telefono", sql.VarChar(20), Telefono || null)
            .input("Direccion", sql.VarChar(200), Direccion || null)
            .query(`UPDATE Clientes SET
                        Nombre = @Nombre,
                        Apellido = @Apellido,
                        Cedula = @Cedula,
                        Correo = @Correo,
                        Telefono = @Telefono,
                        Direccion = @Direccion
                    OUTPUT INSERTED.*
                    WHERE ID_Cliente = @id`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM Clientes WHERE ID_Cliente = @id");
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        res.status(204).send();
    } catch (err) {
        if (err.number === 547) {
            return res.status(409).json({ error: "No se puede eliminar: el cliente tiene ordenes asociadas" });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
