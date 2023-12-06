const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
// const multipart = require('connect-multiparty');
const port = process.env.HOST_PORT;


const app = express();

// logger
app.use(logger('dev'));

// parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 정적 파일 등록
app.use('/uploads', express.static('../uploads'));

// app.use(multipart()); //formdata를 파싱해줌

// cors
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.219.104:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));

// OPTIONS 요청 처리
app.options('*', (req, res) => {
  res.sendStatus(204);
});


// routes
const routes = require('./routes');
app.use('/api', routes);

app.listen(port, () => {
  console.log(`running ${port}`);
});
module.exports = app;