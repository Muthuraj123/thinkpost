var express = require('express');
var router = express.Router();
var notificationController = require('./../controllers/notification')

router.get('/getNotifications/:id', notificationController.getNotifications);
router.post('/accepted', notificationController.accepted);

module.exports = router;