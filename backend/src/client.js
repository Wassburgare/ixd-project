const WebSocket = require('ws');
const messages = require('./message');

const ws = new WebSocket('ws://localhost:8081');

ws.on('open', () => {
  console.log('Connected to server');

  ws.send(JSON.stringify({
    type: messages.JOIN_QUEUE,
    user: {
      name: 'Clutchek',
      eyes: 0,
      mouth: 0,
    },
  }));
});

ws.on('message', (msg) => {
  const message = JSON.parse(msg);

  ws.send(JSON.stringify({
    type: messages.PLAY_INSTRUMENT,
    note: Math.random(),
  }));

  console.log(message);
});
