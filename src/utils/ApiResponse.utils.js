class ApiResponse {
  constructor(statusCode, data, message = "Success"){
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400 // restricts sending anything above 400 as it is responding not giving error
  }
}

export {ApiResponse}