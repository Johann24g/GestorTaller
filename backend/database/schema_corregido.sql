-- Version corregida de tu script original.
-- Unico cambio: Stock.Demanda pasa de INT a VARCHAR(10) para que el CHECK
-- con textos ('Alta','Media','Baja') sea valido.
-- Si tu base ya existe y esta funcionando, NO necesitas correr esto:
-- solo ejecuta el ALTER TABLE que esta al final si te da error en esa columna.

CREATE DATABASE GestionTaller;
GO
USE GestionTaller;
GO
CREATE TABLE Clientes (
    ID_Cliente INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Apellido VARCHAR(50) NOT NULL,
    Cedula VARCHAR(20) NOT NULL UNIQUE,
    Correo VARCHAR(100),
    Telefono VARCHAR(20),
    Direccion VARCHAR(200),
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO
CREATE TABLE Empleados (
    ID_Empleado INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Apellido VARCHAR(50) NOT NULL,
    Cedula VARCHAR(20) NOT NULL UNIQUE,
    Cargo VARCHAR(20),
    Usuario VARCHAR(50) NOT NULL UNIQUE,
    Contrasena VARCHAR(50) NOT NULL,
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO
CREATE TABLE Ordenes (
    ID_Orden INT IDENTITY(1,1) PRIMARY KEY,
    ID_Cliente INT NOT NULL,
    Dispositivo VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(200),
    FechaRecibo DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Ordenes_Clientes
        FOREIGN KEY (ID_Cliente)
        REFERENCES Clientes(ID_Cliente)
);
GO
CREATE TABLE Piezas (
    ID_Pieza INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Sistema VARCHAR(10),
    Marca VARCHAR(50),
    Color VARCHAR(20),
    Descripcion VARCHAR(400),
    PrecioUnitario DECIMAL(10,2) NOT NULL
);
GO
CREATE TABLE Stock (
    ID_Pieza INT PRIMARY KEY,
    Cantidad INT NOT NULL CHECK (Cantidad >= 0),
    Demanda VARCHAR(10) NOT NULL CHECK (Demanda IN ('Alta', 'Media', 'Baja')),
    CONSTRAINT FK_Stock_Piezas
        FOREIGN KEY (ID_Pieza)
        REFERENCES Piezas(ID_Pieza)
);
GO
CREATE TABLE Reparaciones (
    ID_Orden INT NOT NULL,
    ID_Cliente INT NOT NULL,
    ID_Empleado INT NOT NULL,
    Estado VARCHAR(20),
    Insumos VARCHAR(MAX),
    CONSTRAINT PK_Reparaciones
        PRIMARY KEY (ID_Orden),
    CONSTRAINT FK_Reparaciones_Ordenes
        FOREIGN KEY (ID_Orden)
        REFERENCES Ordenes(ID_Orden),
    CONSTRAINT FK_Reparaciones_Clientes
        FOREIGN KEY (ID_Cliente)
        REFERENCES Clientes(ID_Cliente),
    CONSTRAINT FK_Reparaciones_Empleados
        FOREIGN KEY (ID_Empleado)
        REFERENCES Empleados(ID_Empleado)
);
GO

-- Si tu base YA existe con Demanda como INT, corre esto en su lugar:
-- ALTER TABLE Stock DROP CONSTRAINT <nombre_del_check>; -- revisa el nombre con sp_helpconstraint 'Stock'
-- ALTER TABLE Stock ALTER COLUMN Demanda VARCHAR(10) NOT NULL;
-- ALTER TABLE Stock ADD CONSTRAINT CK_Stock_Demanda CHECK (Demanda IN ('Alta','Media','Baja'));
