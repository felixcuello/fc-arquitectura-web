///////////////////////////////////////////////////////////////
// Gracias express por tanto, perdón por tan poco
///////////////////////////////////////////////////////////////
const express = require('express');
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
app.get('/ping', (req, res) => {
  res.send('pong');
})


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
