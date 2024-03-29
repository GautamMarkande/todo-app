const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name:{
     type:String,
     required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    username:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    isEmialAuthemticated:{
        type:Boolean,
        required:true,
        default:false
    }
})
module.exports = mongoose.model('user',UserSchema)