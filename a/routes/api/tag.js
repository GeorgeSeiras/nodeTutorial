const router = require('express').Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');

router
    .route('/')
    .get(async function(req,res,next){
        Article.find.distinct('taglist')
            .then(function(tags){
                return res.json({tags:tags});
            }).catch(next);
    });
module.exports=router;