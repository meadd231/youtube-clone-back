const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");

const CommentsController = require("../controllers/comments.controller");
const commentsController = new CommentsController();

router.post("/comment", auth, commentsController.postComment);

router.post("/replies/reply", auth, commentsController.postReply);

router.get("/count/:videoId", commentsController.getCommentsCount);

router.get("/:videoId", auth, commentsController.getComments);

router.get("/:commentId/replies", auth, commentsController.getReplies);

router.post("/:commentId/like", auth, commentsController.postCommentLike);

router
  .route("/:commentId")
  .patch(auth, commentsController.patchComment)
  .delete(auth, commentsController.deleteComment)
module.exports = router;
