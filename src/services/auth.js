const { User } = require("../sequelize");
const bcrypt = require("bcrypt");

class AuthService {
  /**
   * 입력 받은 password를 bcrypt를 이용해서 hashing함.
   * @param {*} password string
   * @returns hashedPassword string
   */
  bcryptHashing = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  };

  /**
   * JWT 토큰 생성
   * @param {*} user: User Model
   * @returns token
   */
  createJwtTokens = (user) => {
    const payload = this.createJwtPayload(user);
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.ACCESS_EXPIRES,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_EXPIRES,
    });
    this.saveRefreshTokenToRedis(user, refreshToken);
    return { accessToken, refreshToken };
  };

  /**
   * JWT Payload 생성
   * @param {*} user: User Model
   */
  createJwtPayload = (user) => {
    const payload = {
      id: user.id,
      nickname: user.nickname,
      channelDescription: user.channelDescription,
      avatar: user.avatar,
    };
    return payload;
  };
}

module.exports = AuthService;
