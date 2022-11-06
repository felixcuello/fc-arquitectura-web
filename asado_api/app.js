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
// CREAR carpeta
///////////////////////////////////////////////////
app.post(/\/location\/.+/, (req, res) => {
  new_folder_location = req.originalUrl.split(/^\/location/)[1];

  db.any('SELECT COUNT(*) FROM folder WHERE location = $1', [new_folder_location])
    .then(function(data) {
      if(data[0]['count'] != 0) {
        console.log('[ERROR] Carpeta Existente ' + new_folder_location);
        res.status(409).send('La carpeta ya existe => ' + new_folder_location);
      } else {
        const new_uuid = uuid.v4();
        new_folder_location = new_folder_location.replace(/\/$/, '');

        db.any('INSERT INTO folder (uuid, location) VALUES ($1, $2)', [new_uuid, new_folder_location])
          .then(function(data) {
            console.log('[OK] Carpeta Creada ' + new_folder_location);
            res.status(200).send('OK, la carpeta fue creada con éxito => ' + new_folder_location);
          })
          .catch(function(error) {
            console.log('[ERROR] Creando Carpeta ' + new_folder_location);
            res.status(500).send('ERROR2, hubo un error al crear la carpeta => ' + new_folder_location);
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR] Creando Carpeta ' + new_folder_location);
      res.status(500).send('ERROR1, hubo un error al crear la carpeta => ' + new_folder_location);
    });
});


///////////////////////////////////////////////////
// BORRAR carpeta
///////////////////////////////////////////////////
app.delete(/\/location\/.+/, (req, res) => {
  const folder_location = req.originalUrl.split(/^\/location/)[1];

  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Borrando Carpeta Inexistente ' + folder_location);
        res.status(404).send('La carpeta NO existe => ' + folder_location);
      } else {
        const folder_uuid = data[0]['uuid'];

        db.any('DELETE FROM file WHERE folder_uuid = $1', [folder_uuid])
          .then(function(data) {
            db.any('DELETE FROM folder WHERE uuid = $1', [folder_uuid])
              .then(function(data) {
                console.log('[INFO] Carpeta Borrada ' + folder_location);
                res.status(200).send('OK, la carpeta fue borrada con éxito => ' + folder_location);
              })
              .catch(function(error) {
                console.log('[ERROR] Borrando Carpeta' + folder_location);
                res.status(500).send('ERROR3, hubo un error al borrar la carpeta => ' + folder_location);
              });
          })
          .catch(function(error) {
            console.log('[ERROR] Borrando Carpeta' + folder_location);
            res.status(500).send('ERROR2, hubo un error al borrar los archivos de la carpeta => ' + folder_location);
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR] Borrando Carpeta' + folder_location);
      res.status(500).send('ERROR1, al borrar la carpeta => ' + folder_location);
    });
});


///////////////////////////////////////////////////
// RENOMBRAR carpeta
///////////////////////////////////////////////////
app.patch(/\/location\/.+/, (req, res) => {
  const folder_location = req.originalUrl.split(/^\/location/)[1];

  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Renombrando Carpeta Inexistente ' + folder_location);
        res.status(404).send('La carpeta NO existe => ' + folder_location);
      } else {
        const folder_uuid = data[0]['uuid'];
        new_folder_location = req.body['new_location'];
        new_folder_location = new_folder_location.replace(/\/$/, '');

        db.any('UPDATE folder SET location = $1 WHERE uuid = $2', [new_folder_location, folder_uuid])
          .then(function(data) {
            console.log('[INFO] Carpeta Renombrada ' + folder_location + ' => ' + new_folder_location);
            res.status(200).send('OK, la carpeta fue renombrada con éxito ' + folder_location + ' => ' + new_folder_location);
          })
          .catch(function(error) {
            console.log('[ERROR] Renombrando Carpeta' + folder_location);
            res.status(500).send('ERROR2, hubo un error al renombrar la carpeta => ' + folder_location);
          });
      }
    })
    .catch(function(error) {
      console.log('[ERROR] Renombrando Carpeta' + folder_location);
      res.status(500).send('ERROR1, al renombrar la carpeta => ' + folder_location);
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

  // chequear la existencia de la carpeta
  db.any('SELECT uuid FROM folder WHERE location = $1', [folder_location])
    .then(function(data) {
      if(data.length == 0) {
        console.log('[WARN] Carpeta destino no existe al subir archivo' + folder_location);
        res.status(404).send('La carpeta NO existe => ' + folder_location);
      } else {
        const folder_uuid = data[0]['uuid'];

        // chequear que no haya un archivo con ese nombre en la carpeta
        db.any('SELECT uuid FROM file WHERE folder_uuid = $1 AND filename=$2', [folder_uuid, filename])
          .then(function(data) {
            if(data.length != 0) {
              console.log('[WARN] Ya existe un archivo con ese nombre' + destination);
              res.status(409).send('La ya existe un archivo con ese nombre => ' + destination);
            } else {
              if(!req.files) {
                console.log('[ERROR] No se subieron archivos');
                res.status(400).send('ERROR1, no fue proporcionado ningun archivo');
              } else {
                const new_uuid = uuid.v4();
                const content = req.files.file.data;

                db.any('INSERT INTO file (uuid, folder_uuid, filename, content) VALUES ($1, $2, $3, $4)', [new_uuid, folder_uuid, filename, content])
                  .then(function(data) {
                    console.log('[INFO] Archivo subido ' + destination);
                    res.status(200).send('OK, archivo subido con exito ' + destination);
                  })
                  .catch(function(error) {
                    console.log('[ERROR] Creando archivo' + destination);
                    res.status(500).send('ERROR2, creando archivo => ' + destination);
                  });
              }
            }
          })
          .catch(function(error) {
            console.log('[ERROR] No se puede crear el archivo ' + filename);
            res.status(500).send('ERROR3, al crear el archivo => ' + destination);
          });
      }
    })
    .catch(function(error) {
      res.status(500).send('ERROR1, al crear el archivo => ' + destination);
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
