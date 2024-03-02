const accessModel = require('../model/accessmodel')
const rateLimiting = async(req,res,next)=>{
    console.log(req.session.id)
    const sessionId = req.session.id
    try {
        const AccessDb = await accessModel.findOne({sessionId:sessionId})
        if(!AccessDb){
            const accessObj = new accessModel({
              sessionId:sessionId,
              time:Date.now(),
            })
            //adding Accessobj First time
            await accessObj.save()
            next()
            return;
        }

        const TimeDiff  = (Date.now()-AccessDb.time)/1000
        if(TimeDiff<5){
             return res.send({
                status:429,
                message:"too many request please wait for some time"
             })
        }
       await accessModel.findOneAndUpdate({sessionId:sessionId},{time:Date.now()})
       next()
    } catch (error) {
        return res.send({
            status:500,
            message:"Databse Error",
            data:error
        })
    }
    
}
module.exports = rateLimiting