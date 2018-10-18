const path = require('path');
const { exec } = require('child_process');
const gm = require('gm');
const WebSocket = require('ws');

const FRAMEBUFFER_DEVICE = '/dev/fb0';

const IMG_DIR = path.resolve(__dirname, '..', '..', 'frontend', 'img');

const AVATAR_LOCATION = path.resolve(__dirname, 'avatar.png');

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;

const AVATAR_SHAVE = 0.15;
const AVATAR_SCALE = 0.8;
const EMPTY_QUEUE_SCALE = 2;

const IMAGE_CENTER_OFFSET = SCREEN_HEIGHT * 0.1;

const USERNAME_FONT_SIZE = SCREEN_HEIGHT * 0.15;
const EMPTY_QUEUE_FONT_SIZE = SCREEN_HEIGHT * 0.08;
const TEXT_CENTER_OFFSET = SCREEN_HEIGHT * 0.34;

// TODO: Set this to some better text
const EMPTY_QUEUE_TEXT = 'To start playing, connect to dprj18 network\nand enter 192.168.1.234 in the browser!';

const ws = new WebSocket('ws://localhost:8081');

displayEmptyQueueImage();

ws.on('message', (message) => {
  const parsedMessage = JSON.parse(message);

  if (parsedMessage
    && parsedMessage.type === 'queue_updated'
    && parsedMessage.data.length > 0) {
    const { eyes, mouth, nickname } = parsedMessage.data[0];

    mergeAvatar(`${IMG_DIR}/Eyes-${eyes}.svg`, `${IMG_DIR}/Mouth-${mouth}.svg`)
      .then(avatar => cropAvatar(avatar))
      .then(avatar => extentImage(avatar))
      .then(avatar => addText(avatar, nickname, USERNAME_FONT_SIZE))
      .then((avatar) => {
        gm(avatar)
          .write(AVATAR_LOCATION, (err) => {
            if (err) console.log(err);
            displayImage();
          });
      });
  } else {
    displayEmptyQueue();
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

const extentImage = avatar => new Promise((resolve, reject) => {
  gm(avatar)
    .gravity('Center')
    .extent(SCREEN_WIDTH, SCREEN_HEIGHT, `+0+${IMAGE_CENTER_OFFSET}`)
    .toBuffer((err, buffer) => {
      if (err) reject(err);
      resolve(buffer);
    });
});

const addText = (avatar, username, fontSize) => new Promise((resolve, reject) => {
  gm(avatar)
    .fontSize(fontSize)
    .drawText(0, TEXT_CENTER_OFFSET, username, 'Center')
    .toBuffer((err, buffer) => {
      if (err) reject(err);
      resolve(buffer);
    });
});

const emptyQueueImage = () => new Promise((resolve, reject) => {
  gm(path.resolve(IMG_DIR, 'hands-on.png'))
    .size(function getSize(sizeErr, size) {
      if (sizeErr) reject(sizeErr);

      this
        .resize(size.width * EMPTY_QUEUE_SCALE, size.height * EMPTY_QUEUE_SCALE)
        .toBuffer((bufferErr, buffer) => {
          if (bufferErr) reject(bufferErr);
          resolve(buffer);
        });
    });
});

const displayEmptyQueueImage = () => {
  emptyQueueImage()
    .then(image => extentImage(image))
    .then(image => addText(image, EMPTY_QUEUE_TEXT, EMPTY_QUEUE_FONT_SIZE))
    .then((image) => {
      gm(image)
        .write(AVATAR_LOCATION, (err) => {
          if (err) console.log(err);
          displayImage();
        });
    });
};

const displayImage = () => {
  exec(`fbi -T 1 -d ${FRAMEBUFFER_DEVICE} --noverbose -a ${AVATAR_LOCATION}`, (err, stdout) => {
    if (err) console.log(err);
    if (stdout) console.log(stdout);
  });
};
