const { Video, User, Comments, CommentLike } = require("../sequelize");

class CommentsService {
  /**
   * create comment record and set options
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
  };

  /**
   * create reply record
   * @param {*} videoId uuid
   * @param {*} commentId uuid
   * @param {*} content string
   * @param {*} user Model<User>
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
  };

    /**
   * comments 배열의 각 comment에 좋아요, 싫어요가 적용됐는지 확인하고 컬럼 추가 후 반환
   * @param {*} user Model<User>
   * @param {*} comments Model<Comment>
   * @returns commentWithLikes array<Comment>
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
}

module.exports = CommentsService;
