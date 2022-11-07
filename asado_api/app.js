///////////////////////////////////////////////////////////////
// Gracias express por tanto, perdón por tan poco
///////////////////////////////////////////////////////////////
const express = require('express');
const uuid = require('uuid');
const fileUpload = require('express-fileupload');
const app = express();

app.use(express.json({
  limit: '100kb',
  type: 'application/json',
  verify: undefined
}))
app.use(fileUpload({
    createParentPath: true
}));

const port = 3000;


///////////////////////////////////////////////////////////////
// Configuración de base de datos
///////////////////////////////////////////////////////////////
const db_host = process.env.POSTGRES_HOST;
const db_port = process.env.POSTGRES_PORT;
const db_user = process.env.POSTGRES_USER;
const db_pass = process.env.POSTGRES_PASSWORD;
const db_name = process.env.POSTGRES_DB;
const pgp = require('pg-promise')(/* options */);

const pg_url = `postgres://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`;
const db = pgp(pg_url);
db.connect() // https://stackoverflow.com/questions/36120435/verify-database-connection-with-pg-promise-when-starting-an-app
    .then(obj => {
        obj.done(); // success, release the connection;
    })
    .catch(error => {
      console.log('[ERROR] al connectarse a la DB: ', error.message || error);
      process.exit(1);
});


///////////////////////////////////////////////////////////////
/// ENDPOINTS
///////////////////////////////////////////////////////////////


// Esto sería como para poner en un health-check para un load balancer
app.get('/ping', (req, res) => {
  res.send('pong');
})


///////////////////////////////////////////////////
// LISTAR carpeta
///////////////////////////////////////////////////
app.get(/\/location\/.+/, (req, res) => {
  const folder_location = req.originalUrl.split(/^\/location/)[1].replace(/\/$/, '');
  res.setHeader('Content-Type', 'application/json');

  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Carpeta Inexistente ' + folder_location);
        res.status(404).send({'error': 'Carpeta inexistente', 'location': folder_location});
      } else {
        const folder_uuid = data[0]['uuid'];

        db.any('SELECT fo.location, fi.filename FROM folder fo, file fi WHERE fi.folder_uuid = fo.uuid AND fo.uuid = $1', [folder_uuid])
          .then(function(data) {
            res.status(200).send({'files': data});
          })
          .catch(function(error) {
            console.log('[ERROR] listando Carpeta' + folder_location);
            res.status(500).send({'error': 'Hubo un error al listar los archivos de la carpeta', 'location': folder_location});
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR] Listando Carpeta' + folder_location);
      res.status(500).send({'error': 'Hubo un error al listar los archivos de la carpeta', 'location': folder_location});
    });
});




///////////////////////////////////////////////////
// CREAR carpeta
///////////////////////////////////////////////////
app.post(/\/location\/.+/, (req, res) => {
  new_folder_location = req.originalUrl.split(/^\/location/)[1];
  res.setHeader('Content-Type', 'application/json');

  db.any('SELECT COUNT(*) FROM folder WHERE location = $1', [new_folder_location])
    .then(function(data) {
      if(data[0]['count'] != 0) {
        console.log('[ERROR] Carpeta Existente ' + new_folder_location);
        res.status(409).send({'error': 'La carpeta ya existe', 'location': new_folder_location});
      } else {
        const new_uuid = uuid.v4();
        new_folder_location = new_folder_location.replace(/\/$/, '');

        db.any('INSERT INTO folder (uuid, location) VALUES ($1, $2)', [new_uuid, new_folder_location])
          .then(function(data) {
            console.log('[OK] Carpeta Creada ' + new_folder_location);
            res.status(200).send({'message': 'La carpeta fue creada con éxito', 'location': new_folder_location});
          })
          .catch(function(error) {
            console.log('[ERROR] Creando Carpeta ' + new_folder_location);
            res.status(500).send({'error': 'Hubo un error al crear la carpeta', 'location': new_folder_location});
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR] Creando Carpeta ' + new_folder_location);
      res.status(500).send({'error': 'Hubo un error al crear la carpeta', 'location': new_folder_location});
    });
});


///////////////////////////////////////////////////
// BORRAR carpeta
///////////////////////////////////////////////////
app.delete(/\/location\/.+/, (req, res) => {
  const folder_location = req.originalUrl.split(/^\/location/)[1];
  res.setHeader('Content-Type', 'application/json');

  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Borrando Carpeta Inexistente ' + folder_location);
        res.status(404).send({'error': 'La carpeta NO existe', 'location': folder_location});
      } else {
        const folder_uuid = data[0]['uuid'];

        db.any('DELETE FROM file WHERE folder_uuid = $1', [folder_uuid])
          .then(function(data) {
            db.any('DELETE FROM folder WHERE uuid = $1', [folder_uuid])
              .then(function(data) {
                console.log('[INFO] Carpeta Borrada ' + folder_location);
                res.status(200).send({'message': 'La carpeta fue borrada con éxito', 'location': folder_location});
              })
              .catch(function(error) {
                console.log('[ERROR] Borrando Carpeta' + folder_location);
                res.status(500).send({'error': 'Hubo un error al borrar la carpeta', 'location': folder_location});
              });
          })
          .catch(function(error) {
            console.log('[ERROR] Borrando Carpeta' + folder_location);
            res.status(500).send({'error': 'Hubo un error al borrar la carpeta', 'location': folder_location});
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR] Borrando Carpeta' + folder_location);
      res.status(500).send({'error': 'Hubo un error al borrar la carpeta', 'location': folder_location});
    });
});


///////////////////////////////////////////////////
// RENOMBRAR carpeta
///////////////////////////////////////////////////
app.patch(/\/location\/.+/, (req, res) => {
  const folder_location = req.originalUrl.split(/^\/location/)[1];
  res.setHeader('Content-Type', 'application/json');

  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Renombrando Carpeta Inexistente ' + folder_location);
        res.status(404).send({'error': 'La carpeta NO existe', 'location': folder_location});
      } else {
        const folder_uuid = data[0]['uuid'];
        new_folder_location = req.body['new_location'].replace(/\/$/, '');

        db.any('UPDATE folder SET location = $1 WHERE uuid = $2', [new_folder_location, folder_uuid])
          .then(function(data) {
            console.log('[INFO] Carpeta Renombrada ' + folder_location + ' => ' + new_folder_location);
            res.status(200).send({'message': 'La carpeta fue renombrada con éxito', 'location': folder_location, 'new_location': new_folder_location});
          })
          .catch(function(error) {
            console.log('[ERROR1] Renombrando Carpeta' + folder_location);
            res.status(500).send({'error': 'Hubo un error al renombrar la carpeta', 'location': folder_location});
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR2] Renombrando Carpeta' + folder_location);
      res.status(500).send({'error': 'Hubo un error al renombrar la carpeta', 'location': folder_location});
    });
});


///////////////////////////////////////////////////
// CREAR archivo
///////////////////////////////////////////////////
app.post(/\/file\/.+/, (req, res) => {
  const destination = req.originalUrl.split(/^\/file/)[1];
  match = destination.match(/^(.+?)\/([^\/]+)$/);
  const folder_location = match[1].replace(/\/$/, '');
  const filename = match[2]
  res.setHeader('Content-Type', 'application/json');

  // chequear la existencia de la carpeta
  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Carpeta destino no existe al subir archivo' + folder_location);
        res.status(404).send({'error': 'La carpeta indicada NO existe', 'location': folder_location});
      } else {
        const folder_uuid = data[0]['uuid'];

        // chequear que no haya un archivo con ese nombre en la carpeta
        db.any('SELECT uuid FROM file WHERE folder_uuid = $1 AND filename=$2', [folder_uuid, filename])
          .then(function(data) {
            if(data.length != 0) {
              console.log('[WARN] Ya existe un archivo con ese nombre => ' + destination);
              res.status(409).send({'error': 'Ya existe un archivo en ese destino', 'location': destination});
            } else {
              if(!req.files) {
                console.log('[ERROR] No se subieron archivos');
                res.status(400).send({'error': 'No fue proporcionado ningún archivo'});
              } else {
                const new_uuid = uuid.v4();
                const content = req.files.file.data;

                db.any('INSERT INTO file (uuid, folder_uuid, filename, content) VALUES ($1, $2, $3, $4)', [new_uuid, folder_uuid, filename, content])
                  .then(function(data) {
                    console.log('[INFO] Archivo subido ' + destination);
                    res.status(200).send({'message': 'El archivo fue subido con éxito', 'location': destination});
                  })
                  .catch(function(error) {
                    console.log('[ERROR] Creando archivo' + destination);
                    res.status(500).send({'error': 'Error creando el archivo', 'location': destination});
                  });
              }
            }
          })
          .catch(function(error) {
            console.log('[ERROR] No se puede crear el archivo ' + filename);
            res.status(500).send({'error': 'Error creando el archivo', 'location': destination});
          });
      }
    })
    .catch(function(error) {
      res.status(500).send('ERROR1, al crear el archivo => ' + destination);
    });
});


///////////////////////////////////////////////////
// OBTENER archivo
///////////////////////////////////////////////////
app.get(/\/file\/.+/, (req, res) => {
  const destination = req.originalUrl.split(/^\/file/)[1];
  match = destination.match(/^(.+?)\/([^\/]+)$/);
  const folder_location = match[1].replace(/\/$/, '');
  const filename = match[2]

  // chequear la existencia de la carpeta
  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Carpeta inexistente' + folder_location);

        res.setHeader('Content-Type', 'application/json');
        res.status(404).send({'error': 'La carpeta indicada NO existe', 'location': folder_location});
      } else {
        const folder_uuid = data[0]['uuid'];

        // chequear que no haya un archivo con ese nombre en la carpeta
        db.any('SELECT filename, content FROM file WHERE folder_uuid = $1 AND filename=$2', [folder_uuid, filename])
          .then(function(data) {
            if(data.length == 0) {
              console.log('[WARN] No existe un archivo con ese nombre => ' + destination);

              res.setHeader('Content-Type', 'application/json');
              res.status(409).send({'error': 'NO existe un archivo con ese nombre', 'location': destination});
            } else {
              const content = data[0]['content'];
              console.log('[INFO] Archivo descargado => ' + destination);
              res.status(200).send(content);
            }
          })
          .catch(function(error) {
            console.log('[ERROR] No se puede descargar el archivo ' + filename);
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send({'error': 'Error al descargar el archivo', 'location': destination});
          });
      }
    })
    .catch(function(error) {
       res.setHeader('Content-Type', 'application/json');
      res.status(500).send('ERROR1, al descargar el archivo => ' + destination);
    });
});


///////////////////////////////////////////////////
// RENOMBRAR ARCHIVO
///////////////////////////////////////////////////
app.patch(/\/file\/.+/, (req, res) => {
  const file_location = req.originalUrl.split(/^\/file/)[1];
  res.setHeader('Content-Type', 'application/json');

  match = file_location.match(/^(.+?)\/([^\/]+)$/);
  const folder_location = match[1].replace(/\/$/, '');
  const filename = match[2]

  db.any('SELECT fo.uuid AS folder_uuid, fi.uuid AS file_uuid FROM folder fo, file fi WHERE fo.location = $1 AND fi.filename = $2 AND fo.uuid = fi.folder_uuid', [folder_location, filename])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Renombrando archivo de una carpeta Inexistente ' + folder_location);
        res.status(404).send({'error': 'El archivo de ORIGEN no existe', 'location': file_location});
      } else {
        new_file_location = req.body['new_location'].replace(/\/$/, '');
        match = new_file_location.match(/^(.+?)\/([^\/]+)$/);

        const new_folder_location = match[1].replace(/\/$/, '');
        const new_filename = match[2]
        const folder_uuid = data[0]['folder_uuid'];
        const file_uuid = data[0]['file_uuid'];

        db.any('SELECT uuid FROM folder WHERE location = $1', [new_folder_location])
          .then(function(data) {
            const new_folder_uuid = data[0]['uuid'];

            db.any('UPDATE file SET folder_uuid = $1, filename = $2 WHERE uuid = $3', [new_folder_uuid, new_filename, file_uuid])
              .then(function(data) {
                console.log('[INFO] Archivo Renombrada ' + file_location + ' => ' + new_file_location);
                res.status(200).send({'message': 'El archivo fue renombrado con éxito', 'location': file_location, 'new_location': new_file_location});
              })
              .catch(function(error) {
                console.log('[ERROR1] Renombrando Archivo' + file_location);
                res.status(500).send({'error': 'Hubo un error al renombrar el archivo', 'location': file_location});
              });
          })
          .catch(function(error) {
            console.log('[ERROR2] Renombrando Archivo: ' + file_location);
            res.status(404).send({'error': 'El archivo destino no existe', 'location': new_file_location});
          });

      }
    })
    .catch(function(error) {
      console.log('[ERROR2] Renombrando Archivo: ' + file_location);
      res.status(500).send({'error': 'Hubo un error al renombrar el archivo', 'location': file_location});
    });
});


///////////////////////////////////////////////////
// BORRAR ARCHIVO
///////////////////////////////////////////////////

app.delete(/\/file\/.+/, (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const file_location = req.originalUrl.split(/^\/file/)[1];
  match = file_location.match(/^(.+?)\/([^\/]+)$/);
  const folder_location = match[1].replace(/\/$/, '');
  const filename = match[2]

  db.any('SELECT fi.uuid FROM file fi, folder fo WHERE fo.uuid = fi.folder_uuid AND fo.location = $1 AND fi.filename = $2', [folder_location, filename])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] El archivo o la carpeta no existen' + file_location);
        res.status(404).send({'error': 'El archivo NO existe', 'location': file_location});
      } else {
        const file_uuid = data[0]['uuid'];

        db.any('DELETE FROM file WHERE uuid = $1', [file_uuid])
          .then(function(data) {
            res.status(200).send({'message': 'El archivo fue borrado con éxito', 'location': file_location});
          })
          .catch(function(error) {
            console.log('[ERROR] Borrando Archivo ' + file_location);
            res.status(500).send({'error': 'Hubo un error al borrar el archivo', 'location': file_location});
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR] Borrando Archivo ' + file_location);
      res.status(500).send({'error': 'Hubo un error al borrar el archivo', 'location': file_location});
    });
});


///////////////////////////////////////////////////////////////
/// STARTUP MESSAGE (Sí, es medio mersa)
///////////////////////////////////////////////////////////////
app.listen(port, () => {
  console.log("                                                         ,----..    ");
  console.log("   ,---,       .--.--.      ,---,           ,---,       /   /   \\   ");
  console.log(" .'     \\     /  /    '.   '  .' \\        .'  .' `\\    /   .     :  ");
  console.log("/   ;    '.  |  :  /`. /  /  ;    '.    ,---.'     \\  .   /   ;.  \\ ");
  console.log(":  :       \\ ;  |  |--`  :  :       \\   |   |  .`\\  |.   ;   /  ` ; ");
  console.log(":  |   /\\   \\|  :  ;_    :  |   /\\   \\  :   : |  '  |;   |  ; \\ ; | ");
  console.log("|  :  ' ;.   :\\  \\    `. |  :  ' ;.   : |   ' '  ;  :|   :  | ; | ' ");
  console.log("|  |  ;/  \\   \\`----.   \\|  |  ;/  \\   \\'   | ;  .  |.   |  ' ' ' : ");
  console.log(":  |    \\  \\ ,'__ \\  \\  |'  :  | \\  \\ ,'|   | :  |  ''   ;  \\; /  | ");
  console.log("|  |  '  '--' /  /`--'  /|  |  '  '--'  '   : | /  ;  \\   \\  ',  /  ");
  console.log("|  :  :      '--'.     / |  :  :        |   | '` ,/    ;   :    /   ");
  console.log("|  | ,'        `--'---'  |  | ,'        ;   :  .'       \\   \\ .'    ");
  console.log("`--''                    `--''          |   ,.'          `---`      ");
  console.log("                                        '---'                       ");
  console.log("");
  console.log('       Almacenamiento Seguro de Archivos Durables Organizados');
  console.log(`                          PUERTO ${port}`);
})
