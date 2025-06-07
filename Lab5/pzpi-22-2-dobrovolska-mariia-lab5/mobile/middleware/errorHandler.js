// Centralized error handling middleware

const handleCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return {
    message,
    statusCode: 400
  };
};

const handleDuplicateFieldsError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
  
  return {
    message,
    statusCode: 400
  };
};

const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(val => val.message);
  const message = `Validation error: ${errors.join('. ')}`;
  
  return {
    message,
    statusCode: 400
  };
};

const handleJWTError = () => {
  return {
    message: 'Invalid token. Please log in again',
    statusCode: 401
  };
};

const handleJWTExpiredError = () => {
  return {
    message: 'Your token has expired. Please log in again',
    statusCode: 401
  };
};

const sendErrorDev = (error, res) => {
  res.status(error.statusCode).json({
    status: 'error',
    error: error,
    message: error.message,
    stack: error.stack
  });
};

const sendErrorProd = (error, res) => {
  // Operational, trusted error: send message to client
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

const globalErrorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    let err = { ...error };
    err.message = error.message;

    // MongoDB Cast Error
    if (error.name === 'CastError') {
      const errorInfo = handleCastError(err);
      err.message = errorInfo.message;
      err.statusCode = errorInfo.statusCode;
      err.isOperational = true;
    }

    // MongoDB Duplicate Field Error
    if (error.code === 11000) {
      const errorInfo = handleDuplicateFieldsError(err);
      err.message = errorInfo.message;
      err.statusCode = errorInfo.statusCode;
      err.isOperational = true;
    }

    // MongoDB Validation Error
    if (error.name === 'ValidationError') {
      const errorInfo = handleValidationError(err);
      err.message = errorInfo.message;
      err.statusCode = errorInfo.statusCode;
      err.isOperational = true;
    }

    // JWT Error
    if (error.name === 'JsonWebTokenError') {
      const errorInfo = handleJWTError();
      err.message = errorInfo.message;
      err.statusCode = errorInfo.statusCode;
      err.isOperational = true;
    }

    // JWT Expired Error
    if (error.name === 'TokenExpiredError') {
      const errorInfo = handleJWTExpiredError();
      err.message = errorInfo.message;
      err.statusCode = errorInfo.statusCode;
      err.isOperational = true;
    }

    sendErrorProd(err, res);
  }
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = {
  globalErrorHandler,
  AppError,
  catchAsync,
  notFound
};