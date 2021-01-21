let mongoose=require('mongoose')

const UserSchema=new mongoose.Schema({
    first_name:{
      type: String,
      required: true,
      trim: true,
    },
    last_name:{
        type: String,
        required: true,
        trim: true,
    },
    date:{
        type: Date,
        required: true,
        trim: true,
      },
    gender:{
        type: String,
        required: true,
        trim: true,
      },
    email:{
        type:String,
        required:true,
        trim: true,
        unique: true,
    },
    mobileNumber:{
        type:Number,
        required:true,
        trim: true,
    },
    address:{
        type: String,
        required: true,
        trim: true,
      },
    password:{
        type: String,
        required: true,
        trim: true,
      }
},
{
    runSettersOnQuery: true
})

const User=mongoose.model('users',UserSchema)
module.exports=User