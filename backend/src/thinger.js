const request = require('request');

const DEVICE_API_URL = 'http://localhost';
const BEARER_TOKEN = '';

const play = (note) => {
  // TODO: Replace with websocket, if possible
  request.post({
    url: DEVICE_API_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
    body: JSON.stringify({
      message: `xylo${note}`,
    }),
  });
};

module.exports = {
  play,
};
