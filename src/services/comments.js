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
}

module.exports = CommentsService;