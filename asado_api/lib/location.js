const uuid = require('uuid');

function get(res, db, folder_location) {
  res.setHeader('Content-Type', 'application/json');
  folder_location = folder_location.replace(/\/$/, '');

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
};

function post(res, db, new_folder_location) {
  res.setHeader('Content-Type', 'application/json');
  new_folder_location = new_folder_location.replace(/\/$/, '');

  db.any('SELECT COUNT(*) FROM folder WHERE location = $1', [new_folder_location])
    .then(function(data) {
      console.log(data);
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
}

function del(res, db, folder_location) {
  res.setHeader('Content-Type', 'application/json');
  folder_location = folder_location.replace(/\/$/, '');

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
};

// Renombrar carpeta
function patch(req, res, db, folder_location) {
  res.setHeader('Content-Type', 'application/json');
  folder_location = folder_location.replace(/\/$/, '');

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
}

module.exports = { del, get, patch, post };
