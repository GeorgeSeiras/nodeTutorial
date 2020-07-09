const router = require('express').Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const auth = require('../auth');

router.param('username', function (req, res, next, username) {
    User.findOne({ username: username })
        .then(function (user) {
            req.profile = user;
            return next();
        }).catch(next);
});

router.get('/:username',auth.optional, function (req, res, next) {
    if (req.payload.id) {
        User.findById(req.payload.id)
            .then(function (user) {
                if (!user) {
                    res.sendStatus(401);
                }
                return res.json({ profile: req.profile.toProfileJson(false) });

            });
    } else {
        return res.json({ profile: req.profile.toProfileJson(false) });
    }
});

router.post('/:username/follow',auth.required,function(req,res,next){
    let profileId = req.profile._id;
    User.findById(req.payload.id).then(function(user){
        if(!user){
            return res.sendStatus(401);
        }
        return user.follow(profileId).then(function(){
            return res.json({profile:req.profile.toProfileJson(user)});
        });
    }).catch(next);
});

router.delete('/:username/follow',auth.required,function(req,res,next){
    let profileId = req.profile._id;
    User.findById(req.payload.id)
        .then(function(user){
            if(!user){
                return res.sendStatus(401);
            }
            return user.unfollow(profileId).then(function(){
                return res.json({profile:req.profile.toProfileJson(user)});
            });
        }).catch(next);
});

module.exports=router;