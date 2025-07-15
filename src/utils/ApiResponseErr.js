class ApiResponse {
    constructor(data, message = "sucess" , statusCode){
        this.data = data
        this.message = message
        this.statusCode = statusCode
        this.sucess = statusCode < 400
    }
}
export {
    ApiResponse
}