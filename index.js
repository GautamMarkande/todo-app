
//imports
const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose')
const clc = require('cli-color')
const bcrypt = require('bcrypt');
const Validater = require('validator')
const session = require('express-session')
const monodbSession = require('connect-mongodb-session')(session)
const jwt = require('jsonwebtoken')
//file imports
const { userDataValidation, generateToken, sendVerificationMail } = require('./utils/userValidation');
const userModel = require('./model/userModel');
const { Auth } = require('./middlewares/userAuthMiddleware');
const todoModel = require('./model/todoModel');
const rateLimiting = require('./middlewares/rateLimiting');


const app = express();
//vaiables
const port = process.env.PORT
const store = new monodbSession({
    uri: process.env.MongoDbUri,
    collection: 'sessions'
})


// middleware
app.set('view engine', "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
}))
app.use(express.static('public'))


// MonoDb Connection
mongoose.connect(process.env.MongoDbUri).then(() => {
    console.log(clc.yellowBright.bold("MongoDb Connected Succesfully"))
}).catch((Error) => {
    console.log("Not Connected error >>", Error)
})

// server Checking
app.get('/', (req, res) => {
    console.log("Todo app is Running ");
    return res.render('landingPage')
})


//apis
//register send html page
app.get('/register', (req, res) => {

    return res.render("registerPage.ejs")
})

//login send html page
app.get('/login', (req, res) => {

    return res.render("loginPage.ejs")
})

//post apis to accept data
app.post('/register', async (req, res) => {
    console.log(req.body)
    const { name, email, username, password } = req.body;
    console.log(name, email, username, password)
    //Data validation
    const HashedPass = await bcrypt.hash(password, parseInt(process.env.SALT))
    try {
        const response = await userDataValidation({ name, email, username, password })
        console.log(response)

    } catch (Error) {
        return res.send({
            status: 400,
            message: "User data error",
            data: Error
        })
    }
    //check if emial already exist or not
    const checkEmailExist = await userModel.findOne({ email: email });

    if (checkEmailExist) {
        return res.send({
            status: 400,
            message: "Email already exist"
        })
    }

    //check username already exist or not
    const checkUserNameExist = await userModel.findOne({ username: username });
    if (checkUserNameExist) {
        {
            return res.send({
                status: 400,
                message: "Username Already Exist"
            })
        }
    }
    const userObj = new userModel({
        name: name,
        email: email,
        username: username,
        password: HashedPass
    })
    //store data into Db
    try {
        const userDb = await userObj.save();
        const varifiedToken = generateToken(email)
         sendVerificationMail(email,varifiedToken)
        
        return res.redirect("/login")
    }
    catch (Error) {
        return res.send({
            status: 500,
            message: "Internal server error",
            data: Error
        })
    }

})
app.get(`/auth/:id`,async(req,res)=>{
    console.log(req.params.id)
    const userEmail = jwt.verify(req.params.id,process.env.SECRET_KEY);
    try {
        await userModel.findOneAndUpdate({email:userEmail},{isEmialAuthemticated:true})
        return res.redirect('/login')
    } catch (error) {
        return res.send({
            status:500,
            message:"Databse Error",
            error:error
        })
    }
   
})
app.post('/login', async (req, res) => {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
        return res.send({
            status: 400,
            message: "Please fill all the details"
        })
    }
    try {
        let userData;
        if (Validater.isEmail(loginId)) {
            userData = await userModel.findOne({ email: loginId })
        } else {
            userData = await userModel.findOne({ username: loginId })
        }
        if (!userData) {
            return res.send({
                status: 400,
                message: 'User not found'
            })
        }
        //check emial is authenticated or not
        if(!userData.isEmialAuthemticated){
            return res.send({
                status:400,
                message: `Your account is not verified yet.`
            })
        }
        //check password matched or not 
        const isMatchedPass = await bcrypt.compare(password, userData.password)
        if (!isMatchedPass) {
            return res.send({
                status: 400,
                message: "Password not matched"
            })
        }
        // console.log(req.session, req.session.id)
        req.session.isAuth = true;
        req.session.user = {
            userId: userData._id,
            email: userData.email,
            username: userData.username,
        }
        // return res.send({
        //     status: 201,
        //     message: "Login Successfull"
        // })
        return res.redirect('/dashboard')
    }
    catch (Error) {
        return res.send({
            status: 500,
            message: "database Error"
        })
    }

})
app.get('/dashboard', Auth, (req, res) => {
    // return res.send("Dashboard page")
    return res.render('dashboardPage.ejs')
})
// logout from the dashboard
app.post("/logout", Auth, (req, res) => {
    // delete req.session.user;
    req.session.destroy((err) => {
        if (err) {
            return res.send({
                status: 500,
                message: 'Server error'
            })
        } else {
            return res.status(200).redirect('/login');
        }
    });

});

app.post('/logout_from_all_devices', Auth, async (req, res) => {
    console.log(req.session.user.username)
    const username = req.session.user.username
    const SessionSchema = new mongoose.Schema({ _id: String }, { strict: false })
    const SessionModel = mongoose.model('session', SessionSchema);

    try {

        const deleteDb = await SessionModel.deleteMany({
            "session.user.username": username
        })
        console.log(deleteDb)
        return res.status(200).redirect('/login')
    } catch (error) {
        return res.send({
            status: 500,
            messsage: "Database error"
        })
    }
})

// =================================

app.post('/create-item', Auth,rateLimiting, async(req, res) => {
    const todoText = req.body.todo;
    const username = req.session.user.username;
    if (!todoText || !username) return res.send({
        status: 400,
        message: 'Missing data'
    })
    else if (!isNaN(todoText)) return res.send({
        status: 400,
        message: 'Invalid data type, Type Should be in string'
    })
    else if (todoText.length < 3 || todoText.length > 200) return res.send({
        status: 400,
        message: `text length should be between 3 and 200 symbols`
    });
    //    if(typeof username!=='string') return res.status(400).json("data must be string");

   const TodoObj = new todoModel({
    todo:todoText,
    username:username,
   })
   try{
       const TodoDb = await TodoObj.save()
       if(TodoDb){
        return res.send({
            status:201,
            message:"Todo Created Successfully",
            data:TodoDb
        })
       }
   }
   catch(Error){
    return res.send({
        status:500,
        message:"Database Error",
        data:Error
    })
   }

})

//read
app.get('/read-item',Auth,async (req,res)=>{
  const username = req.session.user.username;
  const SKIP = Number(req.query.skip) || 0
  const LIMIT = 5;

  try{
  const todo = await todoModel.aggregate([
        {
            $match:{
            username:username
            },
        }, 
       {
        $facet:{
            data:[{$skip:SKIP},{$limit:LIMIT}]
        }
       }
  ]);
  console.log(todo[0].data.length)
  if(todo[0].data.length===0){
    return res.send({
        status:400,
        message:SKIP===0?"Todos Not Found":"No more Todos",
        data:todo[0].data
    })
  }
  console.log(todo[0].data)
  return res.send({
    status:200,
    message:"All Todos Listed",
    data:todo[0].data
  })
}
catch(error){
    return res.send({
        status:500,
        message:"Database error",
        data:error
    })
}
})
//edit
app.post('/edit-item',Auth,async(req,res)=>{
    const {id,newData} = req.body;
    if(!newData){
        return res.send({
            status:400,
            message:"Please provide new Data"
        })
    }
    try{
    const todo = await todoModel.findOne({_id:id});
    if(!todo){
      return res.send({
        status:400,
        message:"Todo not found"
      })
    }
    if(todo.username!==req.session.user.username){
       return res.send({
        status:403,
        message:"Unauthorized Access"
       })
    }
    const prevTodo = await todoModel.findOneAndUpdate(
        {_id:id},
        {todo:newData}
        )
        return res.send({
            status:201,
            message:'Item Edited Successfully',
            data:prevTodo
        })
    }
    catch(Error){
       return res.send({
        status:500,
        message:"Server Error",
        data:Error
       })
    }
})
//delete
app.post('/delete-item',Auth,async(req,res)=>{
    const {id} = req.body
    if(!id) return res.status(400).json({message:"Missing Id"})
    const username = req.session.user.username;
    try{

        const todo = await todoModel.findOne({_id:id});
        if(!todo){
            return res.send({
                status:400,
                message:"Todo not found"
            })
        }
        if(username!==todo.username){
            return res.send({
                status:403,
                message:"You are Not Authorised to perform this action"
            })
        }
        const DeletedTodo = await todoModel.findOneAndDelete({_id:id})
        if(DeletedTodo){
            console.log(DeletedTodo)
        }
        return res.status(200).json("Todo deleted successfully")
    }
    catch(Error){
        return res.status(500).json("Database  error")
    }
})
app.listen(port, () => {
    console.log(clc.yellowBright.underline(`server is running on http://localhost:${port}`))
})