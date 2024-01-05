const { User } = require("../sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const multer = require("multer");
const redis = require("../redis");
const path = require("path");

const AuthService = require("../services/auth");

class AuthController {
  constructor() {
    this.CLIENT_ID =
      "1068422300037-8dbd9nkbtoriimouhcta0091nmn3fc0i.apps.googleusercontent.com";
    this.client = new OAuth2Client(this.CLIENT_ID);
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "../uploads/avatars"); // 파일이 저장될 폴더 지정
      },
      filename: (req, file, cb) => {
        cb(
          null,
          `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
      },
    });
    this.upload = multer({ storage: this.storage });
  }

  authService = new AuthService();

  signup = async (req, res, next) => {
    try {
      const user = await User.create(req.body);

      user.password = await this.authService.bcryptHashing(user.password);
      await user.save();

      const tokens = this.authService.createJwtTokens(user);

      res.status(200).json({ success: true, tokens });
    } catch (error) {
      next(error, req, res, '회원가입에 실패했습니다.');
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return next({
          message: "The email is not yet registered",
          statusCode: 400,
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return next({
          message: "The password does not match",
          statusCode: 400,
        });
      }

      const tokens = this.authService.createJwtTokens(user);

      res.status(200).json({ success: true, tokens });
    } catch (error) {
      next(error, req, res, '로그인에 실패했습니다.');
    }
  };

  /**
   * Redis에 refreshToken 저장
   * @param {*} user User Model
   * @param {*} refreshToken string
   */
  saveRefreshTokenToRedis = (user, refreshToken) => {
    const key = `refreshToken:${user.id}`;
    redis.set(key, refreshToken);
  };

  /**
   * 구글 로그인, 회원가입 api
   */
  googleOauth = async (req, res, next) => {
    try {
      const returnValue = await this.verifyGoogleToken(req.body.credential);
      if (returnValue.type === "login") {
        const tokens = this.authService.createJwtTokens(returnValue.user);
        return res.status(200).json({ success: true, tokens });
      } else if (returnValue.type === "signup") {
        // 회원가입 기능 아직 처리가 다 안 된 듯
        const tokens = this.authService.createJwtTokens(returnValue.user);
        return res.status(201).json({ success: true, tokens });
      }
      res.status(200).json({ success: true });
    } catch (error) {
      next(error, req, res, '구글 로그인에 실패했습니다.');
    }
  };

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

      let returnValue = {};
      if (user) {
        // 로그인 하러 가기.
        console.log("google login 로그인");
        returnValue = { type: "login", data: payload, user };
      } else {
        // 회원가입 하기.
        // 회원가입 기능의 경우도 로그인 처럼 token을 발급해줘야 할 것 같음.
        console.log("google login 회원가입");
        const createdUser = await User.create({
          email,
          password: payload["sub"],
          nickname: payload["name"],
        });
        returnValue = { type: "signup", data: payload, user: createdUser };
      }

      return returnValue;
    } catch (error) {
      console.error("Google 토큰 검증 실패:", error);
      throw new Error("Google 토큰 검증 실패");
    }
  };

  putAvatar = async (req, res, next) => {
    try {
      const { user } = req.locals;
      console.log("File received:", req.file);
      // 파일 처리 또는 필요한 작업을 수행
      user.avatar = req.file.filename;
      await user.save();
      res.json({ success: true, type: "change", avatar: user.avatar });
    } catch (error) {
      next(error, req, res, '아바타 저장에 실패했습니다.');
    }
  };

  avatarReset = async (req, res, next) => {
    try {
      const { user } = req.locals;
      user.avatar = "avatar.png";
      await user.save();
      res
        .status(200)
        .json({ success: true, type: "reset", avatar: "avatar.png" });
    } catch (error) {
      next(error, req, res, '아바타 초기화에 실패했습니다.');
    }
  };

  /**
   * refreshToken의 유효성 검사 후 accessToken 반환
   */
  tokenRefresh = async (req, res) => {
    const { refreshToken } = req.body;
    
    try {
      const decodedPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  
      // Redis에서 Refresh Token 검증
      redis.get(`refreshToken:${decodedPayload.id}`, (err, userData) => {
        if (err || !userData) {
          return res.status(401).json({ message: "유효하지 않은 리프레시 토큰" });
        }
        // user를 찾아서 새로 만들어주는 게 나을려나?
        delete decodedPayload.iat;
        delete decodedPayload.exp;
        console.log('decodedPayload', decodedPayload);
        // 유효하면 새로운 Access Token 발급
        const accessToken = jwt.sign(
          {
            ...decodedPayload
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.ACCESS_EXPIRES }
        );
  
        res.json({ accessToken });
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '리프레시 토큰이 만료되었습니다', refreshTokenExpired: true });
      } else {
        return res.status(401).json({ message: '유효하지 않은 리프레시 토큰' });
      }
    }
  }
}

module.exports = AuthController;
