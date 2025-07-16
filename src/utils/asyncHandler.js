const asyncHandler = (func) => {
  return (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch((err) => {
      console.error("Async error caught: in async handler function", err);
      next(err);
    });
  };
};

export default asyncHandler;





// const asyncHandler = (func) => async( req,res,next) => {
//     try {
//        await  func(req,res,next)
//     } catch (error) {
//         res.status(err.code || 400)
//     }
// }