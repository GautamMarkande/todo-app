const Validater = require('validator');

const userDataValidation = ({name,email,username,password})=>{
    return new Promise((resolve,reject)=>{
       if(!name||!email||!username || !password){
         reject("Please fill all the details")
       }
       if(typeof name!=='string') reject("Name should be as String type")
       if(typeof email!=='string') reject("email should be as String type")
       if(typeof username!=='string') reject("username should be as String type")
       if(typeof password!=='string') reject("password should be as String type")
       
       if(username.length<3 || username.length>=20){
          reject("Username length should be between 3 - 20 char")
       }
         
       if(password.length<3 || password.length>=20){
        reject("password length should be between 3 - 20 char")
       }

    //    if(!Validater.isAlphanumeric(password))
    //      reject("password must contain a-z, A-Z, 0-9")
       
       if(!Validater.isEmail(email))
        reject("incorrect email")
       
       resolve("Registration Successfull")
    })
}
module.exports = {userDataValidation}