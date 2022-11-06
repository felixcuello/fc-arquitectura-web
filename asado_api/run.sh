npm install express pg-promise nodemon uuid

# Esto es una mala práctica. Pero es una salida fácil para algo que
# no se ejecuta tannto... :-)
WAITING_TIME=5
echo "------------------------------------------------"
echo "Esperando ${WAITING_TIME} segundos por la base de datos :-)"
echo "------------------------------------------------"
sleep ${WAITING_TIME}

# NOTE: "nodemon" lo pongo para hacer el TP, pero no está bueno usarlo en PROD por las dudas
npx nodemon app.js
