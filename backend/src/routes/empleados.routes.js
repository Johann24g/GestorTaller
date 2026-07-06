const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../db");
const { requireRole } = require("../middleware/auth");


router.get("/", async (req, res) => {
    try {
        const pool = await getPool();
        const { q } = req.query;
        let query = "SELECT ID_Empleado, Nombre, Apellido, Cedula, Cargo, Usuario, FechaRegistro FROM Empleados";
        const request = pool.request();
        if (q) {
            query += " WHERE Nombre LIKE @q OR Apellido LIKE @q OR Usuario LIKE @q";
            request.input("q", sql.VarChar, `%${q}%`);
        }
        query += " ORDER BY ID_Empleado DESC";
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
            .query("SELECT ID_Empleado, Nombre, Apellido, Cedula, Cargo, Usuario, FechaRegistro FROM Empleados WHERE ID_Empleado = @id");
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Empleado no encontrado" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post("/", requireRole("Administrador"), async (req, res) => {
    try {
        const { Nombre, Apellido, Cedula, Cargo, Usuario, Contrasena } = req.body;
        if (!Nombre || !Apellido || !Cedula || !Usuario || !Contrasena) {
            return res.status(400).json({ error: "Nombre, Apellido, Cedula, Usuario y Contrasena son obligatorios" });
        }
        const hash = await bcrypt.hash(Contrasena, 10);
        const pool = await getPool();
        const result = await pool.request()
            .input("Nombre", sql.VarChar(50), Nombre)
            .input("Apellido", sql.VarChar(50), Apellido)
            .input("Cedula", sql.VarChar(20), Cedula)
            .input("Cargo", sql.VarChar(20), Cargo || null)
            .input("Usuario", sql.VarChar(50), Usuario)
            .input("Contrasena", sql.VarChar(100), hash)
            .query(`INSERT INTO Empleados (Nombre, Apellido, Cedula, Cargo, Usuario, Contrasena)
                    OUTPUT INSERTED.ID_Empleado, INSERTED.Nombre, INSERTED.Apellido, INSERTED.Cedula, INSERTED.Cargo, INSERTED.Usuario, INSERTED.FechaRegistro
                    VALUES (@Nombre, @Apellido, @Cedula, @Cargo, @Usuario, @Contrasena)`);
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ error: "Cedula o Usuario ya existen" });
        }
        res.status(500).json({ error: err.message });
    }
});


router.put("/:id", requireRole("Administrador"), async (req, res) => {
    try {
        const { Nombre, Apellido, Cedula, Cargo, Usuario, Contrasena } = req.body;
        const pool = await getPool();
        const request = pool.request()
            .input("id", sql.Int, req.params.id)
            .input("Nombre", sql.VarChar(50), Nombre)
            .input("Apellido", sql.VarChar(50), Apellido)
            .input("Cedula", sql.VarChar(20), Cedula)
            .input("Cargo", sql.VarChar(20), Cargo || null)
            .input("Usuario", sql.VarChar(50), Usuario);

        let setContrasena = "";
        if (Contrasena) {
            const hash = await bcrypt.hash(Contrasena, 10);
            request.input("Contrasena", sql.VarChar(100), hash);
            setContrasena = ", Contrasena = @Contrasena";
        }

        const result = await request.query(`UPDATE Empleados SET
                    Nombre = @Nombre, Apellido = @Apellido, Cedula = @Cedula,
                    Cargo = @Cargo, Usuario = @Usuario ${setContrasena}
                OUTPUT INSERTED.ID_Empleado, INSERTED.Nombre, INSERTED.Apellido, INSERTED.Cedula, INSERTED.Cargo, INSERTED.Usuario, INSERTED.FechaRegistro
                WHERE ID_Empleado = @id`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Empleado no encontrado" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete("/:id", requireRole("Administrador"), async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM Empleados WHERE ID_Empleado = @id");
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Empleado no encontrado" });
        }
        res.status(204).send();
    } catch (err) {
        if (err.number === 547) {
            return res.status(409).json({ error: "No se puede eliminar: el empleado tiene reparaciones asociadas" });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
