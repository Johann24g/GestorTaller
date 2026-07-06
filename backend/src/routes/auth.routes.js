const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, getPool } = require("../db");


router.post("/login", async (req, res) => {
    try {
        const { Usuario, Contrasena } = req.body;
        if (!Usuario || !Contrasena) {
            return res.status(400).json({ error: "Usuario y Contrasena son obligatorios" });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input("Usuario", sql.VarChar(50), Usuario)
            .query("SELECT ID_Empleado, Nombre, Usuario, Cargo, Contrasena FROM Empleados WHERE Usuario = @Usuario");

        const empleado = result.recordset[0];
        
        if (!empleado) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        const passwordOk = await bcrypt.compare(Contrasena, empleado.Contrasena);
        if (!passwordOk) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        const token = jwt.sign(
            { id: empleado.ID_Empleado, usuario: empleado.Usuario, cargo: empleado.Cargo },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            token,
            empleado: {
                id: empleado.ID_Empleado,
                nombre: empleado.Nombre,
                usuario: empleado.Usuario,
                cargo: empleado.Cargo
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
