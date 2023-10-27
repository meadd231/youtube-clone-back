const express = require("express");
const router = express.Router();
const { User } = require('../sequelize');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRouter = require('./auth.routes');

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

router.use('/auth', authRouter);

module.exports = router;
