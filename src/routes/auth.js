const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");

const AuthController = require("../controllers/auth.controller");
const authController = new AuthController();

// 회원가입
router.post("/signup", authController.signup);

// 로그인
router.post("/login", authController.login);

// 구글 로그인
router.post("/google-oauth", authController.googleOauth);

// 프로필 이미지 수정
router.put(
  "/avatar",
  auth,
  authController.upload.single("file"),
  authController.putAvatar
);
router.put("/avatar/reset", auth, authController.avatarReset);

router.post("token/refresh", (req, res) => {
  const { refreshToken } = req.body;
  // Redis에서 Refresh Token 검증
  client.get(refreshToken, (err, userData) => {
    if (err || !userData) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // 유효하면 새로운 Access Token 발급
    const accessToken = jwt.sign(
      {
        /* 사용자 정보 */
      },
      "your-access-token-secret",
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  });
});

module.exports = router;
