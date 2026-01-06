class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Not Found' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
}

module.exports = { AppError, notFoundHandler, errorHandler };