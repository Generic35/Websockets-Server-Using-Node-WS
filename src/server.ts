import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

export class TrainMessage {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false,
  ) { }
}

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

function createMessage(sender = 'NS', content: string, isBroadcast = false, ): string {
  return JSON.stringify(new TrainMessage(sender, content, isBroadcast));
}

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: ExtWebSocket) => {

  ws.isAlive = true;

  ws.on('pong', () => {

    console.log('PONG RECEIVED!');
    ws.isAlive = true;
  })

  //connection is up, let's add a simple simple event
  //connection is up, let's add a simple simple event
  ws.on('message', (msg: string) => {

    const message = JSON.parse(msg) as TrainMessage;

    setTimeout(() => {
      if (message.isBroadcast) {

        //send back the message to the other clients
        wss.clients
          .forEach(client => {
            if (client != ws) {
              client.send(createMessage(message.sender, message.content, true));
            }
          });
      }
      ws.send(createMessage('Web socket server', `You sent -> ${message.content}`, message.isBroadcast));
    }, 1000);
  });

  //send immediatly a feedback to the incoming connection    
  ws.send(createMessage('Web socket server', 'Hi there, I am a WebSocket server', true));

  ws.on('error', (err) => {
    console.warn(`Client disconnected - reason: ${err}`);
  })
});

setInterval(() => {
  wss.clients.forEach((ws: ExtWebSocket) => {

    const extWs = ws as ExtWebSocket;

    if (!extWs.isAlive) {
      console.log('logging of client for innactivity', ws)
      return extWs.terminate();
    } else {
      console.log('client was active 10s ago, pinging him again!', ws)
      extWs.isAlive = false;
      extWs.ping(null, undefined);
    }
  });
}, 10000);

//start our server
server.listen(process.env.PORT || 8999, () => {
  const { port } = server.address() as WebSocket.AddressInfo;
  console.log(`Server started on port ${port} :)`);
});