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
   * @param {*} user: Model<User>
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

  /**
   * Redis에 refreshToken 저장
   * @param {*} user Model<User>
   * @param {*} refreshToken string
   */
  saveRefreshTokenToRedis = (user, refreshToken) => {
    const key = `refreshToken:${user.id}`;
    redis.set(key, refreshToken);
  };

  /**
   *
   * @param {string} token string
   * @returns {object} userData { type("login" or "signup"), data: payload, user: Model<User> }
   */
  verifyGoogleToken = async (token) => {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: this.CLIENT_ID, // 클라이언트 ID를 지정하여 검증
      });

      const payload = ticket.getPayload();
      const userId = payload["sub"];
      const email = payload["email"];
      // 여기서 userId를 이용하여 사용자를 인증하고 추가 작업 수행
      const user = await User.findOne({ where: { email } });

      if (user) {
        // 로그인 하러 가기.
        console.log("google login 로그인");
        return { type: "login", data: payload, user };
      } else {
        // 회원가입 하기.
        // 회원가입 기능의 경우도 로그인 처럼 token을 발급해줘야 할 것 같음.
        console.log("google login 회원가입");
        const createdUser = await User.create({
          email,
          password: payload["sub"],
          nickname: payload["name"],
        });
        return { type: "signup", data: payload, user: createdUser };
      }

    } catch (error) {
      console.error("Google 토큰 검증 실패:", error);
      throw new Error("Google 토큰 검증 실패");
    }
  };
}

module.exports = AuthService;
