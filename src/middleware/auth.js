const { User } = require("../sequelize");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  const token = req.headers.authorization;
  console.log("token", token);

  const userId = findUserIdByToken(token);
  const user = await User.findByPk(userId);
  req.locals = { user };
  req.body.user = user;
  next();
};

const findUserIdByToken = (token) => {
  try {
    // JWT를 디코딩하여 토큰의 내용을 확인
    const tokenWithoutBearer = token.replace("Bearer ", "");
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    console.log("decoded", decoded);

    // 토큰의 내용 중에서 사용자 id 가져오기 (예: subject 클레임에서)
    const userId = decoded.id;

    return userId;
  } catch (error) {
    // 토큰이 유효하지 않은 경우 또는 디코딩에 실패한 경우
    console.error("Error decoding token:", error);
    return null;
  }
};

module.exports = { auth };
