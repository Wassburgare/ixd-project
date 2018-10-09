const uuid = require('uuid/v4');

const users = [];
const wsToUser = new Map();
const userToWs = new Map();

const addUser = (user, ws) => {
  const newUser = { ...user, uuid: uuid() };
  users.push(newUser);
  wsToUser.set(ws, newUser);
  userToWs.set(newUser, ws);
};

const removeUser = (ws) => {
  const user = wsToUser.get(ws);

  users.splice(users.indexOf(user), 1);
  wsToUser.delete(ws);
  userToWs.delete(user);
};

const getAllWs = () => Array.from(userToWs.values());

const getAllUsers = () => Array.from(wsToUser.values());

const getWsFromUser = user => userToWs.get(user);

const getUserFromWs = ws => wsToUser.get(ws);

const hasWs = ws => wsToUser.has(ws);

const hasUser = user => userToWs.has(user);

const size = () => users.length;

const peekWs = () => getWsFromUser(users[0]);

const peekUser = () => users[0];

const compareUsers = (u1, u2) => u1.uuid === u2.uuid;

module.exports = {
  addUser,
  removeUser,
  getAllWs,
  getAllUsers,
  hasWs,
  hasUser,
  getWsFromUser,
  getUserFromWs,
  peekWs,
  peekUser,
  compareUsers,
  size,
};
