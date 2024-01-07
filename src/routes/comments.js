const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const { auth, authOption, authNeed } = require("../middleware/auth");

const CommentsController = require("../controllers/comments.controller");
const commentsController = new CommentsController();

router.post(
  "/comment",
  authNeed,
  [body("content").isLength({ min: 1, max: 100 }).withMessage('댓글 내용은 1자 이상 100자 이하여야 합니다.')],
  commentsController.postComment
);

router.post("/replies/reply", authNeed, commentsController.postReply);

router.get("/count/:videoId", commentsController.getCommentsCount);

router.get("/:videoId", authOption, commentsController.getComments);

router.get("/:commentId/replies", authOption, commentsController.getReplies);

router.post("/:commentId/like", authNeed, commentsController.postCommentLike);

router
  .route("/:commentId")
  .patch(auth, commentsController.patchComment)
  .delete(auth, commentsController.deleteComment);
module.exports = router;
