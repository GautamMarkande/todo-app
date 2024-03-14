const Validater = require('validator');
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

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
const generateToken = (email)=>{
  const token = jwt.sign(email,process.env.SECRET_KEY);
  return token;
}
const sendVerificationMail=(email,varifiedToken)=>{
    //transporter
    const transporter = nodemailer.createTransport({
      host:"smtp.gmail.com",
      port:465,
      secure:true,
      service:'gmail',
      auth:{
         user: 'gautammarkande71@gmail.com',
         pass: "mnpr ldkr aeba cncy"
      }
    })
    //mail option
    const mailOption = {
      from:'gautammarkande71@gmail.com',
      to:email,
      subject:`Please verify your Email for Todo App`,
      html:`click <a href=${process.env.URL}/auth/${varifiedToken}>here</a>`

   }
    //send mail
    transporter.sendMail(mailOption,(err,data)=>{
     if(err) console.log('error in sending verification Mail ', err);
     else console.log(`verification Mail sent successfully to ${data}`);
    });
}
module.exports = {userDataValidation,generateToken,sendVerificationMail};