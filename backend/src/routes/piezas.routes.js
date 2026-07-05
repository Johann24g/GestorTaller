const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");

// GET /api/piezas -> incluye cantidad y demanda del stock (si existe)
router.get("/", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT p.ID_Pieza, p.Nombre, p.Sistema, p.Marca, p.Color, p.Descripcion, p.PrecioUnitario,
                   s.Cantidad, s.Demanda
            FROM Piezas p
            LEFT JOIN Stock s ON s.ID_Pieza = p.ID_Pieza
            ORDER BY p.ID_Pieza DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/piezas/:id
router.get("/:id", async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query(`
                SELECT p.ID_Pieza, p.Nombre, p.Sistema, p.Marca, p.Color, p.Descripcion, p.PrecioUnitario,
                       s.Cantidad, s.Demanda
                FROM Piezas p
                LEFT JOIN Stock s ON s.ID_Pieza = p.ID_Pieza
                WHERE p.ID_Pieza = @id
            `);
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Pieza no encontrada" });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/piezas -> crea la pieza y opcionalmente su registro de stock
router.post("/", async (req, res) => {
    const { Nombre, Sistema, Marca, Color, Descripcion, PrecioUnitario, Cantidad, Demanda } = req.body;
    if (!Nombre || PrecioUnitario === undefined) {
        return res.status(400).json({ error: "Nombre y PrecioUnitario son obligatorios" });
    }
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const piezaResult = await new sql.Request(transaction)
                .input("Nombre", sql.VarChar(50), Nombre)
                .input("Sistema", sql.VarChar(10), Sistema || null)
                .input("Marca", sql.VarChar(50), Marca || null)
                .input("Color", sql.VarChar(20), Color || null)
                .input("Descripcion", sql.VarChar(400), Descripcion || null)
                .input("PrecioUnitario", sql.Decimal(10, 2), PrecioUnitario)
                .query(`INSERT INTO Piezas (Nombre, Sistema, Marca, Color, Descripcion, PrecioUnitario)
                        OUTPUT INSERTED.*
                        VALUES (@Nombre, @Sistema, @Marca, @Color, @Descripcion, @PrecioUnitario)`);

            const nuevaPieza = piezaResult.recordset[0];

            if (Cantidad !== undefined && Demanda) {
                await new sql.Request(transaction)
                    .input("ID_Pieza", sql.Int, nuevaPieza.ID_Pieza)
                    .input("Cantidad", sql.Int, Cantidad)
                    .input("Demanda", sql.VarChar(10), Demanda)
                    .query(`INSERT INTO Stock (ID_Pieza, Cantidad, Demanda) VALUES (@ID_Pieza, @Cantidad, @Demanda)`);
            }

            await transaction.commit();
            res.status(201).json({ ...nuevaPieza, Cantidad: Cantidad ?? null, Demanda: Demanda ?? null });
        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/piezas/:id -> actualiza pieza y hace upsert del stock
router.put("/:id", async (req, res) => {
    const { Nombre, Sistema, Marca, Color, Descripcion, PrecioUnitario, Cantidad, Demanda } = req.body;
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const piezaResult = await new sql.Request(transaction)
                .input("id", sql.Int, req.params.id)
                .input("Nombre", sql.VarChar(50), Nombre)
                .input("Sistema", sql.VarChar(10), Sistema || null)
                .input("Marca", sql.VarChar(50), Marca || null)
                .input("Color", sql.VarChar(20), Color || null)
                .input("Descripcion", sql.VarChar(400), Descripcion || null)
                .input("PrecioUnitario", sql.Decimal(10, 2), PrecioUnitario)
                .query(`UPDATE Piezas SET
                            Nombre = @Nombre, Sistema = @Sistema, Marca = @Marca,
                            Color = @Color, Descripcion = @Descripcion, PrecioUnitario = @PrecioUnitario
                        OUTPUT INSERTED.*
                        WHERE ID_Pieza = @id`);

            if (piezaResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: "Pieza no encontrada" });
            }

            if (Cantidad !== undefined && Demanda) {
                await new sql.Request(transaction)
                    .input("ID_Pieza", sql.Int, req.params.id)
                    .input("Cantidad", sql.Int, Cantidad)
                    .input("Demanda", sql.VarChar(10), Demanda)
                    .query(`
                        IF EXISTS (SELECT 1 FROM Stock WHERE ID_Pieza = @ID_Pieza)
                            UPDATE Stock SET Cantidad = @Cantidad, Demanda = @Demanda WHERE ID_Pieza = @ID_Pieza
                        ELSE
                            INSERT INTO Stock (ID_Pieza, Cantidad, Demanda) VALUES (@ID_Pieza, @Cantidad, @Demanda)
                    `);
            }

            await transaction.commit();
            res.json({ ...piezaResult.recordset[0], Cantidad: Cantidad ?? null, Demanda: Demanda ?? null });
        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/piezas/:id
router.delete("/:id", async (req, res) => {
    try {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await new sql.Request(transaction)
                .input("id", sql.Int, req.params.id)
                .query("DELETE FROM Stock WHERE ID_Pieza = @id");
            const result = await new sql.Request(transaction)
                .input("id", sql.Int, req.params.id)
                .query("DELETE FROM Piezas WHERE ID_Pieza = @id");
            await transaction.commit();
            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({ error: "Pieza no encontrada" });
            }
            res.status(204).send();
        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
