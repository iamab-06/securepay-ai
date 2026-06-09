const { errorResponse } = require('../utils/response');

exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let message = err.message || 'Server Error';
  let statusCode = err.statusCode || 500;

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      message = 'Duplicate field value entered';
      statusCode = 400;
    }
  }

  return errorResponse(res, message, statusCode);
};
