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

/**
 * 어떤 로직으로 동작해야 할까?
 */
router.post("/token/refresh", authController.tokenRefresh);

module.exports = router;
