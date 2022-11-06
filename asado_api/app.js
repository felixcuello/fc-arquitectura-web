///////////////////////////////////////////////////////////////
// Gracias express por tanto, perdón por tan poco
///////////////////////////////////////////////////////////////
const express = require('express');
const uuid = require('uuid');
const app = express();
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
  const new_folder_location = req.originalUrl.split(/\/location/)[1];
  db.any('SELECT COUNT(*) FROM folder WHERE location = $1', [new_folder_location])
    .then(function(data) {
      if(data[0]['count'] != 0) {
        res.status(409).send('La carpeta ya existe => ' + new_folder_location);
      } else {
        const new_uuid = uuid.v4();
        db.any('INSERT INTO folder (uuid, location) VALUES ($1, $2)', [new_uuid, new_folder_location])
          .then(function(data) {
            res.status(200).send('OK, la carpeta fue creada con éxito => ' + new_folder_location);
          })
          .catch(function(error) {
            res.status(500).send('ERROR2, hubo un error al crear la carpeta => ' + new_folder_location);
          });
      }
    })
    .catch(function(error) {
      res.status(500).send('ERROR1, hubo un error al crear la carpeta => ' + new_folder_location);
    });
});

///////////////////////////////////////////////////
// CREAR carpeta
///////////////////////////////////////////////////
app.delete(/\/location\/.+/, (req, res) => {
  const new_folder_location = req.originalUrl.split(/\/location/)[1];
  db.any('SELECT uuid FROM folder WHERE location = $1', [new_folder_location])
    .then(function(data) {
      if(data.length == 0) {
        res.status(404).send('La carpeta NO existe => ' + new_folder_location);
      } else {
        const folder_uuid = data[0]['uuid'];

        db.any('DELETE FROM file WHERE folder_uuid = $1', [folder_uuid])
          .then(function(data) {
            db.any('DELETE FROM folder WHERE uuid = $1', [folder_uuid])
              .then(function(data) {
                res.status(200).send('OK, la carpeta fue borrada con éxito => ' + new_folder_location);
              })
              .catch(function(error) {
                res.status(500).send('ERROR3, hubo un error al borrar la carpeta => ' + new_folder_location);
              });
          })
          .catch(function(error) {
            res.status(500).send('ERROR2, hubo un error al borrar los archivos de la carpeta => ' + new_folder_location);
          });
      }
    })
    .catch(function(error) {
      res.status(500).send('ERROR1, al borrar la carpeta => ' + new_folder_location);
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
