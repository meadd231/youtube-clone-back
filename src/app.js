const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
const port = process.env.HOST_PORT;


const app = express();

// logger
app.use(logger('dev'));

// parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// cors
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });

app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.219.104:3000']
}));


// routes
const routes = require('./routes');
app.use('/api', routes);

app.listen(port, () => {
  console.log(`running ${port}`);
});
module.exports = app;