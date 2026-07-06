const sql = require("mssql");
require("dotenv").config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false"
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(config)
            .then((pool) => {
                console.log("Conectado a SQL Server:", process.env.DB_DATABASE);
                return pool;
            })
            .catch((err) => {
                poolPromise = null; 
                console.error("Error al conectar a SQL Server:", err.message);
                throw err;
            });
    }
    return poolPromise;
}

module.exports = { sql, getPool };
