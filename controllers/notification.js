const notificationService = require('./../services/notification');

async function getNotifications(req, res, next) {
    await notificationService.getNotifications(req, res, next);
}

async function accepted(req, res, next) {
    await notificationService.accepted(req, res, next);
}

module.exports = {
    getNotifications,
    accepted
}