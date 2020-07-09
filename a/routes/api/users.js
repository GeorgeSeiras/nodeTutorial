const mongoose = require('mongoose');
const router = require('express').Router();
const passport = require('passport');
const User = mongoose.model('User');
const auth = require('../auth');


router
    .route('/user')
    .get(auth.required, async function (req, res, next) {
         await User.findById(req.payload.id).then(function (user) {
            if (!user) { return res.sendStatus(401); }

            return res.json({ user: user.toAuthJSON() });
        })
    })
    .put(auth.required, function (req, res, next) {
        User.findById(req.payload.id).then(function (user) {
            if (!user) {
                return res.sendStatus(401);
            }
            if (typeof req.body.email !== 'undefined') {
                user.email = req.body.email
            }
            if (typeof req.body.bio !== 'undefined') {
                user.email = req.body.bio
            }
            if (typeof req.body.image !== 'undefined') {
                user.email = req.body.image
            }
            if (typeof req.body.password !== 'undefined') {
                user.email = req.body.password
            }
            return user.save().then(function () {
                return res.json({ user: user.toAuthJSON });
            });
        }).catch(next);
    })

router
    .post('/user/login', function (req, res, next) {
        if (!req.body.email) {
            return res.status(422).json({ errors: { email: "can't be blank" } });
        }

        if (!req.body.password) {
            return res.status(422).json({ errors: { password: "can't be blank" } });
        }
        passport.authenticate('local', { session: false }, function (err, user, info) {
            if (err) { return next(err); }

            if (user) {
                user.token = user.generateJWT();
                return res.json({ user: user.toAuthJSON() });
            } else {
                return res.status(422).json(info);
            }
        })(req, res, next);
    });

router
    .post('/users', function (req, res, next) {
        try {
            let user = new User();
            user.username = req.body.username;
            user.email = req.body.email;
            user.setPassword(req.body.password);
            user.save().then((user) => {
                return res.json({user: user.toAuthJSON()});

            })
        } catch (err) {
            console.log(err);
        } (next);
    });

module.exports = router;