-- Crea la tabla de carpetas
CREATE TABLE folder (
  uuid UUID PRIMARY KEY,
  location VARCHAR(1024) NOT NULL
);
