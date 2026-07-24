/*
  ============================================================
  SERVER DEL SITO ESTERNO - MPU-6050 Tilt Monitor
  ============================================================
  Questo è il "sito" a cui l'ESP32 manda i dati.
  Fa due cose:
    1) Serve la pagina index.html ai browser che si collegano
    2) Riceve via WebSocket i dati inviati dall'ESP32 e li
       rilancia in tempo reale a tutti i browser collegati

  COME USARLO:
    1) Installa Node.js (https://nodejs.org) se non lo hai già.
    2) In questa cartella esegui:  npm install
    3) Poi esegui:                  npm start
    4) Il sito sarà visibile su http://localhost:3000 (o sulla
       porta che imposti con la variabile d'ambiente PORT).

  DOVE OSPITARLO (perché sia raggiungibile da internet, non solo
  dal tuo PC):
    - Puoi caricare questa cartella su un servizio gratuito come
      Render.com, Railway.app o Glitch.com (cercano "package.json"
      e "server.js" ed eseguono automaticamente "npm start").
    - Una volta online otterrai un indirizzo tipo:
        https://tuo-progetto.onrender.com
      Quello è il "link del sito" da inserire nello sketch ESP32
      come WEBSOCKET_HOST (senza https://, solo il dominio),
      con WEBSOCKET_PORT = 443 e WEBSOCKET_USA_SSL = true.
  ============================================================
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORTA = process.env.PORT || 3000;

// --- Server HTTP: serve la pagina index.html ---
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const contenuto = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(contenuto);
  } else {
    res.writeHead(404);
    res.end('Non trovato');
  }
});

// --- Server WebSocket sullo stesso percorso "/ws" usato da ESP32 e pagina web ---
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (client) => {
  console.log('Nuovo client collegato via WebSocket (ESP32 o browser).');

  client.on('message', (messaggio) => {
    // Rilancia il messaggio ricevuto (dall'ESP32) a tutti gli
    // altri client collegati (i browser che mostrano la pagina).
    wss.clients.forEach((altroClient) => {
      if (altroClient !== client && altroClient.readyState === WebSocket.OPEN) {
        altroClient.send(messaggio.toString());
      }
    });
  });

  client.on('close', () => {
    console.log('Client disconnesso.');
  });
});

server.listen(PORTA, () => {
  console.log(`Server avviato: http://localhost:${PORTA}`);
});
