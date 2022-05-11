const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt"),
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;
const UserModel = require("../models/user");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
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
        const user = await UserModel.findOne({ email });

        if (!user) {
          return cb(null, false, { message: 'User not found' });
        }

        const validate = await user.isValidPassword(password);

        if (!validate) {
          return cb(null, false, { message: 'Wrong Password' });
        }

        return cb(null, user, { message: 'Logged in Successfully' });
      } catch (error) {
        return cb(error);
      }
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "your_jwt_secret",
    },
    (jwtPayload, cb) => {
      //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.

      const email = jwtPayload.email;
      return UserModel.findOne({ email })
        .then((user) => {
          return cb(null, user);
        })
        .catch((err) => {
          return cb(err);
        });
    }
  )
);
