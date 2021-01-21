const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require("bcrypt");
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const app = express();

const dotenv =require('dotenv') 
dotenv.config()

const UserSchema=require('./models/User');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(session({secret:"secret",resave:false}))
app.use(express.static(__dirname + '/'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

const port=process.env.PORT
const path1=process.env.PATH1

mongoose.connect('mongodb://mongo/proj',{
    useNewUrlParser:true,
})
var checking=(req,res,next)=>{
    if(req.session.user){
        next()
    }
    else{
        res.redirect("/login")
    }
}
var loginchecking=(req,res,next)=>{
    if(req.session.user){
        res.redirect("/menu")
    }
    else{
        next()
    }
}
var cacheControl=(req,res,next)=>{
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next()
}
app.get("/",loginchecking,cacheControl,async(req,res)=>{
    await res.render('base.html')
})

app.get('/register',loginchecking,cacheControl,async(req,res)=>{
    await res.render('register.html',{error:""})
})
app.get('/login',loginchecking,cacheControl,async(req,res)=>{
    await res.render('login.html',{error:"",success:""})
})
app.get('/update',checking,async(req,res)=>{
    const id=req.session.user.id
    let data1=await UserSchema.findById(id)
    console.log(data1)
    res.render('update.html',{data:data1,message:""})
})
app.get('/delete',checking,async(req,res)=>{
    await res.render('delete.html')
})
app.get('/menu',checking,cacheControl,async(req,res)=>{
    await res.render('menu.html')
})
app.get('/forgot',loginchecking,async(req,res)=>{
    await res.render('resetpassword.html',{message:"",error:""})
})
app.post('/signin',async(req,res)=>{
    let email=req.body.email
    let password=req.body.password
    let result=await UserSchema.findOne({email:email})
        if(result===null){
            res.send("No data")
        }
        else if(result){
            let check=bcrypt.compareSync(password,result.password)
                if(check)
                {
                    req.session.user = 
                    {
                        email: result.email,
                        username: result.last_name+" "+result.first_name,
                        id:result._id
                    }
                    console.log(req.session)
                    req.session.cookie.expires = new Date(
                        Date.now() + 3 *60 * 1000 
                    )
                    res.redirect('/menu')
                }
                else{
                    res.render('login.html',{success:"",error:"Invalid password"})
                }
            }
            else{
                res.redirect("/")
            }
        })
app.post('/signup',async(req,res)=>{
        let {fname,lname,date,gender,email,mobile,address,psw}=req.body
        let data={
            first_name:fname,
            last_name:lname,
            date:date,
            gender:gender,
            email:email,
            mobileNumber:mobile,
            address:address,
            password:bcrypt.hashSync(psw,9)
        }
        try{
        let user=new UserSchema(data)
        await user.save()
        console.log("hii")
        res.render('login.html',{success:"Registered sucessfully",error:""})
        }
        catch(e){
            if(e.code==11000){
                res.render('register.html',{error:"Email-Id already exists"})
            }else{
                res.status(500).send("Something went wrong")
            }
        }
})
app.post('/update1',async(req,res)=>{
    const id=req.session.user.id
    let {fname,lname,email,mobile,address}=req.body
    try{
        let updatedUser=await UserSchema.findById(id)
        updatedUser.first_name=fname
        updatedUser.last_name=lname
        updatedUser.email=email
        updatedUser.mobileNumber=mobile
        updatedUser.address=address
        await updatedUser.save()
        console.log('data saved')
       res.render('update.html',{message:"Updated Sucessfully",data:updatedUser})
    }
    catch(err){
      res.status(400).send({message:"bad req"})
    }
    res.status(200).send("data saved")
  })
  
app.post('/recordDelete',async (req,res)=>{
    console.log(req.session.user.id)
    await UserSchema.findByIdAndRemove(req.session.user.id)
    res.send("done...")
  })

app.post('/generateotp',async(req,res)=>{
      let email=req.body.email
      req.session.user_email=email
      try{
        let result = await UserSchema.findOne({email:email})
        if(result){
            req.session.otp = otpGenerator.generate(6,{upperCase:false,specialChars:false,alphabets:false})
        }
        req.session.cookie.expires = new Date(Date.now() + 60 * 1000 )
        var transport = nodemailer.createTransport({
            service:'gmail',
            auth:{
                user:'test.rcx.we4@gmail.com',
                pass:'rcxcoremail'
            }
        })
        var mailOptions = {
            from: 'test.rcx.we4@gmail.com',
            to: result.email,
            subject: 'OTP for Reset Password',
            text: 'As you requested for the reset password of your application account.'+
            'The below is the otp enter in the application '+
            req.session.otp+' and this otp will expires within 3 minutes'+
            ' If this action is not performed by you please ignore.'
        }
        let status=transport.sendMail(mailOptions)
            if(status){
                res.status(200).render('resetpassword.html',{message:"Email sent",error:""})
            }
        }
        catch(err){
            res.render('resetpassword.html',{message:err,error:""})
        }
  })

  app.post("/enterotp",cacheControl,async(req,res)=>{
      let otp=req.body.otp
      if(otp===req.session.otp){
        res.render('conformpassword.html')
      }else{
        res.render('resetpassword.html',{message:"",error:"Invalid Otp!! Try Again"})
      }
  })
app.post('/changepass',cacheControl,async(req,res)=>{
    let email=req.session.user_email
    let password=req.body.password
    try{
        let result = await UserSchema.findOne({email:email})
        await UserSchema.updateOne({_id:result._id},{password:bcrypt.hashSync(password,9)})        
        req.session.destroy()
        res.render('login.html',{success:"Password changed successfully",message:""})
    }
    catch(err){
        res.render('login.html',{message:"some thing went wrong..."})
    }
   
})
app.all("/logout",checking,(req,res)=>{
    req.session.destroy()
    res.redirect("/login")
  })
app.listen(port,()=>console.log(`server is running on port ${port}`))
