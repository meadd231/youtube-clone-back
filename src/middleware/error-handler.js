errorHandler = (error, req, res, defaultMessage) => {
  console.error(`${req.method} ${req.originalUrl} : ${error.message}`);
  console.error(error);

  // error.errorCode 아쉽다. AppError가 아니라 다른 에러인 경우
  if (!error.errorCode) {
    return res.status(400).json({ errorMessage: defaultMessage });
  } else {
    return res.status(error.errorCode).json({ errorMessage: error.errorMessage });
  }
}

module.exports = errorHandler;