const { Video, User, Comments, CommentLike } = require("../sequelize");

class CommentsController {
  /**
   * 댓글 작성 api
   */
  postComment = async (req, res) => {
    try {
      const { content, videoId } = req.body;
      const { user } = req.locals;
      const comment = await this.createComment(videoId, content, user);
      res.status(201).json({ success: true, comment });
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * create comment record
   * @param {*} videoId uuid
   * @param {*} content string
   * @param {*} user Model
   * @returns comment Model
   */
  createComment = async (videoId, content, user) => {
    const comment = await Comments.create({
      videoId,
      userId: user.id,
      content,
    });
    this.setOptionToComment(comment, user);
    return comment;
  }

  /**
   * comment에 프론트에서 필요한 유저와의 상호작용 정보를 적용함.
   * 궁금한 점이 이러면 함수형 프로그래밍의 철학에 어긋나는 것 같은데 새로운 comment 객체를 만들어서 반환하는 것이 맞는 걸까?
   * @param {*} comment Model
   * @param {*} user Model
   */
  setOptionToComment = (comment, user) => {
    comment.dataValues.liked = false;
    comment.dataValues.disliked = false;
    comment.dataValues.User = {
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  /**
   * 답글 작성 api
   */
  postReply = async (req, res) => {
    try {
      const { content, videoId, commentId } = req.body;
      const { user } = req.locals;
      const reply = await this.createReply(videoId, commentId, content, user);
      res
        .status(201)
        .json({ success: true, reply });
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
  }

  getCommentsCount = async (req, res) => {
    try {
      const { videoId } = req.params;
      const commentCount = await Comments.count({ where: { videoId } });
      res.status(200).json({ success: true, commentCount });
    } catch (error) {
      console.error(error);
    }
  };

  getComments = async (req, res) => {
    const { videoId } = req.params;
    const { user } = req.body;
    try {
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

  getReplies = async (req, res) => {
    try {
      const { commentId } = req.params;
      const { user } = req.body;

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

    console.log("commentId", commentId);
    const comment = await Comments.findOne({ where: { id: commentId } });
    const commentLike = await CommentLike.findOne({
      where: { commentId, userId: user.id },
    });
    console.log("commentLike", commentLike);
    let liked = false;
    let disliked = false;

    if (type == "like") {
      if (!commentLike) {
        await CommentLike.create({ userId: user.id, commentId, type });
        comment.likes++;
        liked = true;
      } else if (commentLike.type == "like") {
        await CommentLike.destroy({ where: { userId: user.id, commentId } });
        comment.likes--;
      } else if (commentLike.type == "dislike") {
        await CommentLike.destroy({ where: { userId: user.id, commentId } });
        comment.dislike--;
        await CommentLike.create({ userId: user.id, commentId, type });
        comment.likes++;
        liked = true;
      }
    } else if (type == "dislike") {
      if (!commentLike) {
        await CommentLike.create({ userId: user.id, commentId, type });
        comment.dislike++;
        disliked = true;
      } else if (commentLike.type == "like") {
        await CommentLike.destroy({ where: { userId: user.id, commentId } });
        comment.likes--;
        await CommentLike.create({ userId: user.id, commentId, type });
        comment.dislike++;
        disliked = true;
      } else if (commentLike.type == "dislike") {
        await CommentLike.destroy({ where: { userId: user.id, commentId } });
        comment.dislike--;
      }
    }
    await comment.save();

    res
      .status(201)
      .json({ success: true, likes: comment.likes, liked, disliked });
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
      await Comments.destroy({where: {id: commentId}});
    } catch (error) {
      console.error(error);
    }
  };
}

module.exports = CommentsController;
