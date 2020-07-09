const router = require('express').Router();
const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const Comment = mongoose.model('Comment');
const User = mongoose.model('User');
const auth = require('../auth');

router.param('article', function (req, res, next, slug) {
    Article.findOne({ slug: slug })
        .populate('author')
        .then(function (article) {
            if (!article) {
                return res.sendStatus(404);
            }
            req.article = article;
        }).catch(next);
});

router.param('comment', function (req, res, next, id) {
    Comment.findById(id)
        .then(function (comment) {
            if (!comment) {
                res.sendStatus(404);
            }
            req.comment = comment;
            return next();
        }).catch(next);
});

router
    .route('/')
    .get(auth.optional, async function (req, res, next) {
        let query = {};
        let limit = 15;
        let offset = 0;

        if (typeof req.query.offset !== 'undefined') {
            offset = req.query.offset;
        }
        if (typeof req.query.limit !== 'undefined') {
            offset = req.query.limit;
        }
        if (typeof req.query.tag !== 'undefined') {
            offset = req.query.tag;
        }
        if (typeof req.query.tag !== 'undefined') {
            query.tagList = { "$in": [req.query.tag] };
        }
        let author = req.query.author = () => {
            User.findOne({ username: req.query.author })
                .then((author) => {
                    if (author) {
                        return author;
                    } else {
                        return null;
                    }
                })
        }
        let favouriter = req.query.favourited = () => {
            User.findOne({ username: req.query.favourited })
                .then((favourited) => {
                    if (favourited) {
                        return favourited;
                    } else {
                        return null;
                    }
                });
        }
        if (author) {
            query.author = author._id;
        }
        if (favouriter) {
            query._id = { $in: favouriter.favourites }
        } else if (req.query.favourited) {
            query._id = { $in: [] }
        }
        let articles = await Article.find(query)
            .limit(Number(limit))
            .skip(Number(offset))
            .sort({ createdAt: 'desc' })
            .populate('author')
        let articlesCount = await Article.count(query).exec();
        let user = await req.payload ? User.findById(req.payload.id) : null;
        return res.json({
            articles: articles.map(function (article) {
                return article.toJSON(user);
            }),
            articleCount: articlesCount
        });
    })
    .post(function (req, res, next) {
        User.findById(req.payload.id).then(function (user) {
            if (!user) {
                return res.sendStatus(401);
            }
            let article = new Article(req.body.article);
            article.author = user;

            return article.save()
                .then(function () {
                    console.log(article);
                    return res.json({ article: article.toJSON(user) });
                });
        }).catch(next);
    });

router
    .get('/feed', function (req, res, next) {

    });

router
    .route('/:article')
    .get(function (req, res, next) {
        let user = await req.payload ? User.findById(req.payload.id) : null;
        await req.article.populate('author').execPopulate();
        return res.json({article:req.article.toJSON(user)});
    })
    .put(function (req, res, next) {

    })
    .delete(function (req, res, next) {

    })

router
    .route('/:article/favourite')
    .post(function (req, res, next) {

    })
    .delete(function (req, res, next) {

    })

router
    .route('/:article/comments')
    .get(function (req, res, next) {

    })
    .post(function (req, res, next) {

    })
    .delete(function (req, res, next) {

    })

modules.export = router;