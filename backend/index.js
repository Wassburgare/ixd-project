const WebSocket = require('ws');
const queue = require('./src/queue');
const thinger = require('./src/thinger');

const PORT = 8081;
const INTERVAL = 10000;

const JOIN_QUEUE = 'join_queue';
const PLAY_INSTRUMENT = 'play_instrument';
const QUEUE_UPDATED = 'queue_updated';

const server = new WebSocket.Server({
  port: PORT,
}, () => {
  console.log(`Server started on port ${PORT}`);
});

let timerId;

server.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const message = JSON.parse(msg);

    switch (message.type) {
      case JOIN_QUEUE:
        joinQueue(message.user, ws);
        break;
      case PLAY_INSTRUMENT:
        if (isUserPlaying(queue.getUserFromWs(ws))) {
          playInstrument(message);
        }
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    if (queue.hasWs(ws)) {
      leaveQueue(ws);
    }
  });
});

const joinQueue = (user, ws) => {
  queue.addUser(user, ws);

  if (queue.size() > 1 && !isTimerStarted()) {
    startTimer();
  }

  informUsers();
};

const leaveQueue = (ws) => {
  queue.removeUser(ws);

  if (queue.size() <= 1 && isTimerStarted()) {
    stopTimer();
  }

  ws.close();

  informUsers();
};

const informUsers = () => {
  queue.getAllWs().forEach((ws) => {
    sendMessage(ws, QUEUE_UPDATED, queue.getAllUsers());
  });
};

const playInstrument = (message) => {
  // TODO: Reformat message depending on how the device API and client messages look
  thinger.play(message);
};

const startTimer = () => {
  timerId = setInterval(setCurrentUser, INTERVAL);
};

const stopTimer = () => {
  clearInterval(timerId);
  timerId = undefined;
};

const isTimerStarted = () => timerId !== undefined;

const setCurrentUser = () => {
  leaveQueue(queue.peekWs());
};

const isUserPlaying = user => queue.compareUsers(user, queue.peekUser());

const sendMessage = (ws, type, data) => {
  ws.send(JSON.stringify({
    type,
    data,
  }));
};
