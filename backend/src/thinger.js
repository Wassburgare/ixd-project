const request = require('request');

const DEVICE_API_URL = 'XXX';
const BEARER_TOKEN = 'YYY';

const play = (message) => {
  // TODO: Replace with websocket, if possible
  request.post({
    url: DEVICE_API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
    body: message,
  });
};

module.exports = {
  play,
};
