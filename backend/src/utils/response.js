exports.successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

exports.errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
