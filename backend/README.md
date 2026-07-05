# Gestión de Taller — Backend (Node.js + Express + SQL Server)

Este backend conecta el frontend (carpeta `frontend/`) con tu base de datos
`GestionTaller` en SQL Server.

## 1. Requisitos
- Node.js 18 o superior instalado (https://nodejs.org)
- SQL Server local corriendo con la base `GestionTaller` ya creada
- Habilitar autenticación mixta (SQL Server + Windows) en tu instancia si vas a usar usuario/contraseña:
  En SQL Server Management Studio (SSMS): clic derecho al servidor → Propiedades → Seguridad →
  marcar "SQL Server and Windows Authentication mode" → reiniciar el servicio de SQL Server.

## 2. Instalación
Abre una terminal dentro de la carpeta `backend/` y ejecuta:

```bash
npm install
```

## 3. Configurar la conexión
1. Copia el archivo `.env.example` y renómbralo a `.env`
2. Ábrelo y coloca tus datos reales:

```
DB_SERVER=localhost\SQLEXPRESS      <- o el nombre de tu instancia
DB_DATABASE=GestionTaller
DB_USER=sa                          <- tu usuario de SQL Server
DB_PASSWORD=tu_contraseña_real
PORT=3000
```

Para saber el nombre de tu instancia: abre SSMS, el nombre que usas para conectarte
(por ejemplo `DESKTOP-ABC1234\SQLEXPRESS` o solo `localhost`) es el que va en `DB_SERVER`.

Si no tienes usuario `sa` habilitado, crea uno en SSMS:
```sql
ALTER LOGIN sa ENABLE;
ALTER LOGIN sa WITH PASSWORD = 'TuContraseñaSegura123';
```

## 4. Ejecutar el backend
```bash
npm start
```

Si todo está bien verás en la consola:
```
Conectado a SQL Server: GestionTaller
Backend corriendo en http://localhost:3000
```

Puedes probar que funciona abriendo en el navegador:
http://localhost:3000/api/health   → debe responder {"status":"ok"}
http://localhost:3000/api/clientes → debe responder tus clientes en JSON (o [] si está vacía)

## 5. Ejecutar el frontend
La carpeta `frontend/` es HTML/CSS/JS puro. Solo abre `index.html` (o cualquiera
de las páginas) directamente en tu navegador haciendo doble clic, o sírvela con
una extensión tipo "Live Server" de VS Code. El archivo `assets/js/api.js`
ya apunta a `http://localhost:3000/api`, así que mientras el backend esté
corriendo (paso 4), las páginas de Clientes, Empleados, Órdenes y Piezas
van a leer y escribir directamente en tu base de datos SQL Server.

## 6. Estructura de carpetas
```
backend/
  .env.example        <- plantilla de configuración (copiar a .env)
  package.json
  database/
    schema_corregido.sql   <- tu script con una corrección de tipo (ver abajo)
  src/
    db.js              <- conexión/pool a SQL Server
    server.js           <- servidor Express, monta todas las rutas
    routes/
      clientes.routes.js
      empleados.routes.js
      ordenes.routes.js
      piezas.routes.js
      reparaciones.routes.js
```

## 7. Nota sobre tu script SQL
En tu script original, la tabla `Stock` define `Demanda` como `INT` pero el
`CHECK` compara contra textos (`'Alta'`, `'Media'`, `'Baja'`). Eso genera error
al crear la tabla o insertar datos. En `database/schema_corregido.sql` dejé la
versión corregida (`Demanda VARCHAR(10)`). Si tu base ya está creada y no te ha
dado error, probablemente ya la ajustaste; si no, al final de ese archivo hay
un `ALTER TABLE` para corregirla sin perder los datos.

## 8. Endpoints disponibles
Todas las rutas viven bajo `http://localhost:3000/api/`:

| Recurso        | Métodos                                  |
|----------------|-------------------------------------------|
| `/clientes`     | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| `/empleados`    | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| `/ordenes`      | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| `/piezas`       | GET, GET /:id, POST, PUT /:id, DELETE /:id |
| `/reparaciones` | GET, GET /:idOrden, POST, PUT /:idOrden, DELETE /:idOrden |

Las órdenes en el frontend combinan `Ordenes` (cliente, dispositivo) con
`Reparaciones` (técnico asignado, estado), tal como estaba diseñado el modal
original de "Nueva orden".

## 9. Problemas comunes
- **"Login failed for user 'sa'"** → revisa usuario/contraseña en `.env`, y que
  la autenticación mixta esté habilitada (paso 1).
- **"Could not connect (ETIMEOUT/ESOCKET)"** → revisa el nombre del servidor
  (`DB_SERVER`), o que el servicio "SQL Server Browser" esté activo si usas
  una instancia con nombre (`\SQLEXPRESS`).
- **CORS / fetch failed en el navegador** → confirma que el backend esté
  corriendo (`npm start`) y que estés usando el puerto correcto en
  `assets/js/api.js`.
