const WebSocket = require('ws');
const timeSpan = require('time-span');
const queue = require('./src/queue');
const thinger = require('./src/thinger');

const PORT = 8081;
const INTERVAL = 120000;

const JOIN_QUEUE = 'join_queue';
const LEAVE_QUEUE = 'leave_queue';
const PLAY_KEY = 'play_key';
const KEY_PLAYED = 'key_played';
const QUEUE_UPDATED = 'queue_updated';

const server = new WebSocket.Server({
  port: PORT,
}, () => {
  console.log(`Server started on port ${PORT}`);
});

let timerId;
let startedPlaying = 0;

server.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const message = JSON.parse(msg);

    switch (message.type) {
      case JOIN_QUEUE:
        // TODO: Respond with error message if user is not added
        if (!queue.hasWs(ws) && isUserValid(message.user)) {
          joinQueue(message.user, ws);
        }
        break;
      case LEAVE_QUEUE:
        if (queue.hasWs(ws)) {
          leaveQueue(ws);
        }
        break;
      case PLAY_KEY:
        if (isUserPlaying(queue.getUserFromWs(ws))) {
          playKey(message.key);
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

  const allUsers = queue.getAllUsers().map(user => removeUserUUID(user));
  sendMessage(ws, QUEUE_UPDATED, allUsers);
});

const joinQueue = (user, ws) => {
  queue.addUser(user, ws);

  if (queue.size() === 1) {
    startedPlaying = new Date().getTime();
  } else if (queue.size() > 1 && !isTimerStarted()) {
    startTimer();
  }

  if (queue.size() === 2 && getElapsedTime() > INTERVAL) {
    setCurrentUser();
  }

  informUsers();
};

const leaveQueue = (ws) => {
  const user = queue.getUserFromWs(ws);

  if (isUserPlaying(user)) {
    startedPlaying = new Date().getTime();
  }

  queue.removeUser(ws);

  if (queue.size() <= 1 && isTimerStarted()) {
    stopTimer();
  }

  informUsers();
};

const informUsers = () => {
  const allUsers = queue.getAllUsers().map(user => removeUserUUID(user));

  if (allUsers.length > 1) {
    allUsers[0].timeLeft = getTimeLeft();
  }

  server.clients.forEach((ws) => {
    sendMessage(ws, QUEUE_UPDATED, allUsers);
  });
};

const isUserValid = user => ['nickname', 'eyes', 'mouth']
  .every(property => Object.prototype.hasOwnProperty.call(user, property));

const playKey = (key) => {
  // TODO: Reformat message depending on how the device API and client messages look
  thinger.play(key);

  server.clients.forEach((ws) => {
    sendMessage(ws, KEY_PLAYED, key);
  });
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

const removeUserUUID = (user) => {
  const { uuid, ...otherKeys } = user;
  return otherKeys;
};

const isUserPlaying = user => queue.compareUsers(user, queue.peekUser());

const getElapsedTime = () => new Date().getTime() - startedPlaying;

const getTimeLeft = () => INTERVAL - (getElapsedTime());

const sendMessage = (ws, type, data) => {
  ws.send(JSON.stringify({
    type,
    data,
  }));
};
