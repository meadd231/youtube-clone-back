const express = require("express");
const router = express.Router();
const { User } = require('../sequelize');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRouter = require('./auth.routes');
const videosRouter = require('./videos.routes');
const commentsRouter = require('./comments.routes');
const subscribesRouter = require('./subscribes.routes');

const { auth } = require('../middleware/auth');

// test 용 api
router.post("/test", (req, res, next) => {
  console.log('req.body', req.body);
  res.send("test success");
});
router.get("/json-array", (req, res, next) => {
  const array = [];
  for (let i = 0; i < 10; i++) {
    let data = {
      num: i,
      id: `data${i}`,
    };
    array.push(data);
  }
  res.json(array);
});
router.post("/test-token", auth, (req, res, next) => {
  console.log('이거 뭐 온 거야 안 온거야?', req.body);
  console.log('req.body', req.body);
  
  res.send("test-token success");
});

router.use('/auth', authRouter);
router.use('/videos', videosRouter);
router.use('/comments', commentsRouter);
router.use('/subscribes', subscribesRouter);

module.exports = router;
