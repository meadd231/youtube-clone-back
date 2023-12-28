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
      const reply = await this.createReply(videoId, commentId, content, user);
      res.status(201).json({ success: true, reply });
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * create reply record
   * @param {*} videoId uuid
   * @param {*} commentId uuid
   * @param {*} content string
   * @param {*} user Model
   * @returns reply Model
   */
  createReply = async (videoId, commentId, content, user) => {
    const reply = await Comments.create({
      videoId,
      commentId,
      content,
      userId: user.id,
    });
    const comment = await Comments.findByPk(commentId);
    comment.replyNum++;
    await comment.save();
    this.setOptionToComment(reply, user);
    return reply;
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

      const commentWithLiked = await this.checkCommentLiked(user, comments);

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

      const commentWithLiked = await this.checkCommentLiked(user, comments);

      res.status(200).json({ success: true, comments: commentWithLiked });
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * comments 배열의 각 comment에 좋아요, 싫어요가 적용됐는지 확인하고 컬럼 추가 후 반환
   * @param {*} user User model의 한 객체
   * @param {*} comments Comment 배열
   * @returns commentWithLikes 배열
   */
  checkCommentLiked = async (user, comments) => {
    let commentWithLikes;
    if (user) {
      // 로그인이 됐으면
      console.log("로그인 됐을 때 성공");
      commentWithLikes = await Promise.all(
        comments.map(async (comment) => {
          const commentLike = await CommentLike.findOne({
            where: { commentId: comment.id, userId: user.id },
          });
          comment.dataValues.liked = false;
          comment.dataValues.disliked = false;
          if (commentLike) {
            if (commentLike.type === "like") {
              comment.dataValues.liked = true;
              return comment;
            } else if (commentLike.type === "dislike") {
              comment.dataValues.disliked = true;
              return comment;
            }
          }
          return comment;
        })
      );
    } else if (!user) {
      // 로그인 안 됐으면
      console.log("로그인 안 됐을 때 성공");
      commentWithLikes = await comments.map((comment) => {
        comment.dataValues.liked = false;
        comment.dataValues.disliked = false;
        return comment;
      });
    }
    return commentWithLikes;
  };

  postCommentLike = async (req, res) => {
    const { commentId } = req.params;
    const { user } = req.locals;
    const { type } = req.body;

    const comment = await Comments.findByPk(commentId);
    const commentLike = await CommentLike.findOne({
      where: { commentId, userId: user.id },
    });

    const likeOptions = await this.applyCommentLike(
      type,
      commentLike,
      comment,
      commentId,
      user
    );

    res.status(201).json({ success: true, ...likeOptions });
  };

  applyCommentLike = async (type, commentLike, comment, commentId, user) => {
    const likeOptions = { likes: 0, liked: false, disliked: false };
    if (!commentLike) {
      if (type == "like") {
        // noneLike
        await this.createLike(user, comment, commentId, likeOptions);
      } else if (type == "dislike") {
        // noneDislike
        await this.createDislike(user, comment, commentId, likeOptions);
      }
    } else if (commentLike.type == "like") {
      if (type == "like") {
        // likeLike
        await this.deleteLike(user, comment, commentId);
      } else if (type == "dislike") {
        // likeDislike
        await this.deleteLike(user, comment, commentId);
        await this.createDislike(user, comment, commentId, likeOptions);
      }
    } else if (commentLike.type == "dislike") {
      if (type == "like") {
        // dislikeLike
        await this.deleteDislike(user, comment, commentId);
        await this.createLike(user, comment, commentId, likeOptions);
      } else if (type == "dislike") {
        // dislikeDislike
        await this.deleteDislike(user, comment, commentId);
      }
    }
    await comment.save();
    likeOptions.likes = comment.likes;
    return likeOptions;
  };

  createLike = async (user, comment, commentId, likeOptions) => {
    await CommentLike.create({ userId: user.id, commentId, type: "like" });
    comment.likes++;
    likeOptions.liked = true;
  };

  createDislike = async (user, comment, commentId, likeOptions) => {
    await CommentLike.create({ userId: user.id, commentId, type: "dislike" });
    comment.dislike++;
    likeOptions.disliked = true;
  };

  deleteLike = async (user, comment, commentId) => {
    await CommentLike.destroy({ where: { userId: user.id, commentId } });
    comment.likes--;
  };

  deleteDislike = async (user, comment, commentId) => {
    await CommentLike.destroy({ where: { userId: user.id, commentId } });
    comment.dislike--;
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
