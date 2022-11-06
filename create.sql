---------------------------------------------
-- Crea la base de datos
---------------------------------------------

-- Borra las tablas primero
-- Esto es para que sea idempotente (y tambien peligroso :laugh:)
DROP TABLE file;
DROP TABLE folder;

-- Crea la tabla de carpetas
CREATE TABLE folder (
  uuid UUID PRIMARY KEY,
  location VARCHAR(1024) NOT NULL
);

-- crea la tabla de archivos
CREATE TABLE file (
  uuid UUID PRIMARY KEY,
  location UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  folder_uuid UUID NOT NULL,
  FOREIGN KEY (folder_uuid) REFERENCES folder(uuid)
);
