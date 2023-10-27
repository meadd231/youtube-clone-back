const express = require("express");
const router = express.Router();
const { User } = require('../sequelize');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const authMiddleWare = require("../middlewares/auth-middleware");

// 회원가입
router.post("/signup", async (req, res, next) => {
  console.log(req.body);
  
  // active record pattern. 즉, user는 User 테이블의 하나의 레코드가 될 수 있는 객체이다.
  const user = await User.create(req.body);

  // 비밀번호 해시화
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  // db에 만든 레코드 저장
  await user.save();

  // jwt 토큰에 userId 담고 토큰 생성
  const payload = { id: user.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRES,
  });

  // 응답
  res.status(200).json({ success: true, data: token });
});

// 로그인
router.post("/login", async (req, res, next) => {
  console.log(req.body);
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
    return next({ message: "The password does not match", statusCode: 400 });
  }

  const payload = { id: user.id, nickname: user.nickname };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRES,
  });

  res.status(200).json({ success: true, token });
});

// const UserController = require("../controllers/users.controller");
// const userController = new UserController();

// router.post('/signup', userController.signup);
// router.post('/login', userController.login);
// router.delete('/:user_id/logout', userController.logout);
// router.post('/email', authMiddleWare, userController.emailAuth);

module.exports = router;
