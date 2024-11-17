var express = require('express');
var router = express.Router();
var postController = require('./../controllers/post')
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/addPost', upload.single('file'), postController.addPost);
router.get('/getPosts/:id', postController.getPosts);
router.delete('/deletePost/:id', postController.deletePost);
router.post('/editPost', upload.single('file'), postController.editPost);
router.post('/likePost', postController.likePost);
router.post('/unlikePost', postController.unlikePost);
router.get('/getComments/:id', postController.getComments);
router.post('/addComment', postController.addComment);
router.post('/testing', postController.testing);

module.exports = router;