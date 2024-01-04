const { Video, User, Comments, CommentLike } = require("../sequelize");
const CommentsService = require("../services/comments");

class CommentsController {
  commentsService = new CommentsService();
  /**
   * 댓글 작성 api
   */
  postComment = async (req, res, next) => {
    try {
      const { content, videoId } = req.body;
      const { user } = req.locals;
      const comment = await this.commentsService.createComment(videoId, content, user);
      res.status(201).json({ success: true, comment });
    } catch (error) {
      next(error, req, res, '댓글 작성에 실패했습니다.');
    }
  };

  /**
   * 답글 작성 api
   */
  postReply = async (req, res) => {
    try {
      const { content, videoId, commentId } = req.body;
      const { user } = req.locals;
      const reply = await this.commentsService.createReply(videoId, commentId, content, user);
      res.status(201).json({ success: true, reply });
    } catch (error) {
      console.error(error);
    }
  };

  getCommentsCount = async (req, res) => {
    try {
      const { videoId } = req.params;
      const commentCount = await Comments.count({ where: { videoId } });
      res.status(200).json({ success: true, commentCount });
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 댓글 조회 api
   */
  getComments = async (req, res) => {
    try {
      const { videoId } = req.params;
      const { user } = req.locals;
      const comments = await Comments.findAll({
        where: { videoId, commentId: null },
        include: [{ model: User, attributes: ["nickname", "avatar"] }],
        order: [["likes", "DESC"]],
      });

      const commentWithLiked = await this.commentsService.checkCommentLiked(user, comments);

      res.status(200).json({ success: true, comments: commentWithLiked });
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 답글 조회 api
   */
  getReplies = async (req, res) => {
    try {
      const { commentId } = req.params;
      const { user } = req.locals;

      const comments = await Comments.findAll({
        where: { commentId },
        include: [{ model: User, attributes: ["nickname", "avatar"] }],
        order: [["createdAt", "ASC"]],
      });

      const commentWithLiked = await this.commentsService.checkCommentLiked(user, comments);

      res.status(200).json({ success: true, comments: commentWithLiked });
    } catch (error) {
      console.error(error);
    }
  };

  postCommentLike = async (req, res) => {
    const { commentId } = req.params;
    const { user } = req.locals;
    const { type } = req.body;

    const comment = await Comments.findByPk(commentId);
    const commentLike = await CommentLike.findOne({
      where: { commentId, userId: user.id },
    });

    const likeOptions = await this.commentsService.applyCommentLike(
      type,
      commentLike,
      comment,
      commentId,
      user
    );

    res.status(201).json({ success: true, ...likeOptions });
  };

  patchComment = async (req, res) => {
    try {
      const { user } = req.locals;
      const { commentId } = req.params;
      const { content } = req.body;
      const comment = await Comments.findByPk(commentId);
      if (user.id !== comment.userId) {
        // 프론트에서도 막겠지만 서버에서도 막아줘야 할 듯
        return res
          .status(401)
          .json({ success: false, message: "올바른 유저가 아닙니다." });
      }
      comment.content = content;
      await comment.save();

      res.status(200).json({ success: true, comment });
    } catch (error) {
      console.error(error);
    }
  };

  deleteComment = async (req, res) => {
    try {
      const { user } = req.locals;
      const { commentId } = req.params;
      const comment = await Comments.findByPk(commentId);
      if (user.id !== comment.userId) {
        // 프론트에서도 막겠지만 서버에서도 막아줘야 할 듯
        return res
          .status(401)
          .json({ success: false, message: "올바른 유저가 아닙니다." });
      }
      await Comments.destroy({ where: { id: commentId } });
    } catch (error) {
      console.error(error);
    }
  };
}

module.exports = CommentsController;
