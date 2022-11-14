const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy
const passportJWT = require('passport-jwt'),
  JWTStrategy = passportJWT.Strategy
const googleStrategies = require('passport-google-oauth2').Strategy
const mongoose = require('mongoose')

const UserModel = require('../models/user')
const config = require('config')
const SECRET = config.get('SECRET_KEY')
const GOOGLE_CONFIG = config.get('GOOGLE_CONFIG')

const cookieExtractor = (req) => {
  let jwt = null

  if (req && req.cookies) {
    jwt = req.cookies['jwt']
  }

  return jwt
}

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, cb) => {
      //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
      //   return UserModel.findOne({ email })
      //     .then((user) => {
      //         const validate = await user.isValidPassword(password)
      //       if (!user) {
      //         return cb(null, false, { message: "Incorrect email or password." });
      //       }  if (!user.isValidPassword(password)) {
      //         return cb(null, false, { message: "Incorrect email or password." });
      //       }
      //       console.log(user)
      //       console.log(password)
      //       console.log(validate)
      //       return cb(null, user, { message: "Logged In Successfully" });
      //     })
      //     .catch((err) => cb(err));
      try {
        const user = await UserModel.findOne({email})

        if (!user) {
          return cb(null, false, {message: 'User not found'})
        }

        const validate = await user.isValidPassword(password)

        if (!validate) {
          return cb(null, false, {message: 'Wrong Password'})
        }

        return cb(null, user, {message: 'Logged in Successfully'})
      } catch (error) {
        return cb(error)
      }
    }
  )
)

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: SECRET,
    },
    (jwtPayload, cb) => {
      //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.

      const email = jwtPayload.email
      return UserModel.findOne({email})
        .then((user) => {
          return cb(null, user)
        })
        .catch((err) => {
          return cb(err)
        })
    }
  )
)


passport.use(new googleStrategies({
    clientID: GOOGLE_CONFIG.GOOGLE_CLENT_ID,
    clientSecret: GOOGLE_CONFIG.GOOGLE_CLENT_SECRET,
    callbackURL:  GOOGLE_CONFIG.GOOGLE_CALLBACK_URL ,
    passReqToCallback: true
},async function(request, accessToken, refreshToken, profile, done){
  try {
    //console.log(profile)
    const user = await UserModel.findOne({email:profile.email})
    if(!user){
      const newUser = new UserModel({
        _id: new mongoose.Types.ObjectId(),
        username: profile.displayName,
        password: profile.id,
        email: profile.email,
        verifyEmail:true
      })
      await newUser.save()
      return done(null,newUser)
    }else 
    return done(null,user)
  } catch (error) {
    return done(error,null)
  }
    
}
))