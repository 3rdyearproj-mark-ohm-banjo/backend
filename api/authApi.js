const router = require("express").Router(),
  jwt = require("jsonwebtoken");
passport = require("passport");
const UserModel = require("../models/user");
const { create, read, update, remove ,readWithPages } = require("../common/crud");


/* POST login. */
router
  .post("/login", (req, res, next) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (user) {
        const payload = { email: user.email ,role:user.role};
        const token = jwt.sign(payload, "your_jwt_secret");
        return res.json({ user, token });
      } else {
        return res.status(422).json(info);
      }
    })(req, res, next);
  })
  .post("/register",create(UserModel))
  .get('/profile', (req, res, next) => {
    res.send(req.user);
});
module.exports = router;
