const Auth = (req,res,next)=>{
    if(req.session.isAuth){
        next()
    }else{
        return res.send({
            status:401,
            message:"You are not authorized to access this resource"
        })
    }
}
module.exports = {Auth}