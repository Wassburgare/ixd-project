const path = require('path');
const { exec } = require('child_process');
const gm = require('gm');
const WebSocket = require('ws');

const FRAMEBUFFER_DEVICE = '/dev/fb0';

const IMG_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'img');
const AVATAR_LOCATION = path.resolve(__dirname, 'avatar.png');

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;

const AVATAR_SCALE = 0.8;
const AVATAR_SHAVE = 0.15;
const AVATAR_CENTER_OFFSET = SCREEN_HEIGHT * 0.1;

const USERNAME_SIZE = SCREEN_HEIGHT * 0.15;
const USERNAME_CENTER_OFFSET = SCREEN_HEIGHT * 0.34;

const ws = new WebSocket('ws://localhost:8081');

ws.on('message', (message) => {
  const parsedMessage = JSON.parse(message);

  if (parsedMessage
    && parsedMessage.type === 'queue_updated'
    && parsedMessage.data.length > 0) {
    const { eyes, mouth, nickname } = parsedMessage.data[0];

    mergeAvatar(`${IMG_DIR}/Eyes-${eyes}.svg`, `${IMG_DIR}/Mouth-${mouth}.svg`)
      .then(avatar => cropAvatar(avatar))
      .then(avatar => extentAvatar(avatar))
      .then(avatar => addUsername(avatar, nickname))
      .then((avatar) => {
        gm(avatar)
          .write(AVATAR_LOCATION, (err) => {
            if (err) console.log(err);
            displayImage();
          });
      });
  } else {
    // TODO: Don't display an avatar
  }
});

const mergeAvatar = (eyes, mouth) => new Promise((resolve, reject) => {
  gm(eyes)
    .append(mouth)
    .in('-size', `${SCREEN_HEIGHT * AVATAR_SCALE}x${SCREEN_HEIGHT * AVATAR_SCALE}`)
    .setFormat('png')
    .toBuffer((err, buffer) => {
      if (err) reject(err);
      resolve(buffer);
    });
});

const cropAvatar = avatar => new Promise((resolve, reject) => {
  gm(avatar)
    .shave(AVATAR_SHAVE * 100, AVATAR_SHAVE * 100, true)
    .toBuffer((err, buffer) => {
      if (err) reject(err);
      resolve(buffer);
    });
});

const extentAvatar = avatar => new Promise((resolve, reject) => {
  gm(avatar)
    .gravity('Center')
    .extent(SCREEN_WIDTH, SCREEN_HEIGHT, `+0+${AVATAR_CENTER_OFFSET}`)
    .toBuffer((err, buffer) => {
      if (err) reject(err);
      resolve(buffer);
    });
});

const addUsername = (avatar, username) => new Promise((resolve, reject) => {
  gm(avatar)
    .fontSize(USERNAME_SIZE)
    .drawText(0, USERNAME_CENTER_OFFSET, username, 'Center')
    .toBuffer((err, buffer) => {
      if (err) reject(err);
      resolve(buffer);
    });
});

const displayImage = () => {
  exec(`fbi -T 1 -d ${FRAMEBUFFER_DEVICE} --noverbose -a ${AVATAR_LOCATION}`, (err, stdout) => {
    if (err) console.log(err);
    if (stdout) console.log(stdout);
  });
};
