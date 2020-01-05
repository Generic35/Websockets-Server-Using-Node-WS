import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: any) => {

  ws.isAlive = true;

  ws.on('pong', () => {

    console.log('PONG RECEIVED!');
    ws.isAlive = true;
  })

  //connection is up, let's add a simple simple event
  ws.on('message', (message: string) => {

    //log the received message and send it back to the client
    console.log('received: %s', message);

    const broadcastRegex = /^broadcast\:/;

    if (broadcastRegex.test(message)) {
      message = message.replace(broadcastRegex, '');

      //send back the message to the other clients
      wss.clients
        .forEach(client => {
          if (client != ws) {
            client.send(`Hello, broadcast message -> ${message}`);
          }
        });

    } else {
      ws.send(`Hello, you sent -> ${message}`);
    }
  });

  //send immediatly a feedback to the incoming connection    
  // ws.send('Hi there, I am a WebSocket server');
});

setInterval(() => {
  wss.clients.forEach((ws: any) => {

    if (!ws.isAlive) {
      console.log('logging of client for innactivity', ws)
      return ws.terminate();
    } else {
      console.log('client was active 10s ago, pinging him again!', ws)
      ws.isAlive = false;
      ws.ping(null, false, true);
    }
  });
}, 10000);

//start our server
server.listen(process.env.PORT || 8999, () => {
  const { port } = server.address() as WebSocket.AddressInfo;
  console.log(`Server started on port ${port} :)`);
});