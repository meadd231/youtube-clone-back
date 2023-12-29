const { User } = require("../sequelize");
const jwt = require("jsonwebtoken");

/**
 * 로그인 안 해도 되고, 했으면 다르게 동작하도록하는 auth
 */
const auth = async (req, res, next) => {
  const token = req.headers.authorization;
  console.log("token", token);

  const userId = findUserIdByToken(token);
  const user = await User.findByPk(userId);
  req.locals = { user };
  req.body.user = user;
  next();
};

/**
 * 로그인 안 됐으면 반드시 막는 auth
 */
const auth2 = async (req, res, next) => {
  const token = req.headers.authorization;
  console.log("token", token);

  const userId = findUserIdByToken(token);
  if (userId === null) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await User.findByPk(userId);
  if (!user) {
    // If user is not found, you can handle it as per your requirements
    return res.status(401).json({ error: 'User not found' });
  }
  req.locals = { user };
  req.body.user = user;
  next();
};

// 근대 이걸 진짜 해야 하나? 그러면 토큰을 사용하는 이유가 없지 않나? 세션을 사용하던가. 하겠지.
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
