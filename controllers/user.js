const userService = require('./../services/user');

async function testing(req, res, next) {
    await userService.testing(req, res, next);
}

async function createUser(req, res, next) {
    await userService.createUser(req, res, next);
}

async function getUser(req, res, next) {
    await userService.getUser(req, res, next);
}

async function suggestedUsers(req, res, next) {
    await userService.suggestedUsers(req, res, next);
}

async function sendRequest(req, res, next) {
    await userService.sendRequest(req, res, next);
}

async function addPost(req, res, next) {
    await userService.addPost(req, res, next);
}

async function updateUser(req, res, next) {
    await userService.updateUser(req, res, next);
}

async function getFriends(req, res, next) {
    await userService.getFriends(req, res, next);
}

async function disconnectFriend(req, res, next) {
    await userService.disconnectFriend(req, res, next);
}

async function getMessages(req, res, next) {
    await userService.getMessages(req, res, next);
}

async function sendMessage(req, res, next) {
    await userService.sendMessage(req, res, next);
}

module.exports = {
    testing,
    createUser,
    getUser,
    suggestedUsers,
    sendRequest,
    addPost,
    updateUser,
    getFriends,
    disconnectFriend,
    getMessages,
    sendMessage
}