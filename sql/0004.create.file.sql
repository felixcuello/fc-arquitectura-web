-- crea la tabla de archivos
CREATE TABLE file (
  id UUID PRIMARY KEY,
  location UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  folder_uuid UUID NOT NULL,
  content bytea NOT NULL,
  FOREIGN KEY (folder_uuid) REFERENCES folder(uuid)
);
