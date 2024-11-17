const postService = require('./../services/post');

async function addPost(req, res, next) {
    await postService.addPost(req, res, next);
}

async function getPosts(req, res, next) {
    await postService.getPosts(req, res, next);
}

async function deletePost(req, res, next) {
    await postService.deletePost(req, res, next);
}

async function editPost(req, res, next) {
    await postService.editPost(req, res, next);
}

async function likePost(req, res, next) {
    await postService.likePost(req, res, next);
}

async function unlikePost(req, res, next) {
    await postService.unlikePost(req, res, next);
}

async function testing(req, res, next) {
    await postService.testing(req, res, next);
}

async function getComments(req, res, next) {
    await postService.getComments(req, res, next);
}

async function addComment(req, res, next) {
    await postService.addComment(req, res, next);
}

module.exports = {
    addPost,
    getPosts,
    deletePost,
    editPost,
    likePost,
    unlikePost,
    testing,
    getComments,
    addComment
}