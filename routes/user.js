var express = require('express');
var router = express.Router();
var userController = require('./../controllers/user')
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.get('/testing', userController.testing);
router.post('/create', userController.createUser);
router.get('/getUser/:id', userController.getUser);
router.get('/suggestedUsers/:id', userController.suggestedUsers);
router.post('/sendRequest', userController.sendRequest);
router.post('/updateUser', upload.single('file'), userController.updateUser);
router.get('/getFriends/:id', userController.getFriends);
router.post('/disconnectFriend', userController.disconnectFriend);
router.post('/getMessages', userController.getMessages);
router.post('/sendMessage', userController.sendMessage);

module.exports = router;