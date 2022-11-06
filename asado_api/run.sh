npm install express
npm install pg-promise

# Esto es una mala práctica. Pero es una salida fácil para algo que
# no se ejecuta tannto... :-)
WAITING_TIME=5
echo "------------------------------------------------"
echo "Esperando ${WAITING_TIME} segundos por la base de datos :-)"
echo "------------------------------------------------"
sleep ${WAITING_TIME}

node app.js
