// util to handle multiple errors using in-built error class of Node

class ApiError extends Error{
  constructor(
    statusCode,
    message= "Something went wrong in API",
    errors = [],
    stack = ""
  ){
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.success = false
    this.error = errors

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export {ApiError}