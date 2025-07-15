const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            console.log("error found on utilities folder and utilites function")
            next(err)
        })
    }
}

export default asyncHandler




// const asyncHandler = (func) => async( req,res,next) => {
//     try {
//        await  func(req,res,next)
//     } catch (error) {
//         res.status(err.code || 400)
//     }
// }