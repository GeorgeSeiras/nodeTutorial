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
      return next();
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
    var query = {};
    var limit = 20;
    var offset = 0;

    if (typeof req.query.limit !== 'undefined') {
      limit = req.query.limit;
    }

    if (typeof req.query.offset !== 'undefined') {
      offset = req.query.offset;
    }

    if (typeof req.query.tag !== 'undefined') {
      query.tagList = { "$in": [req.query.tag] };
    }
    req.query.author = await User.findOne({ username: req.query.author });
    req.query.favorited = await User.findOne({ username: req.query.favorited });

    let author = req.query.author;
    let favoriter = req.query.favorited;
    if (author) {
      query.author = author._id;
    }

    if (favoriter) {
      query._id = { $in: favoriter.favorites };
    } else if (req.query.favorited) {
      query._id = { $in: [] };
    }



    let articles = await Article.find(query)
      .limit(Number(limit))
      .skip(Number(offset))
      .sort({ createdAt: 'desc' })
      .populate('author')
      .exec()
    if (req.payload != null) {
      req.payload = await User.findById(req.payload.id);
    }
    let articlesCount = await Article.count(query).exec();
    return res.json({
      articles: articles.map(function (article) {
        return article.toJSON(req.payload);
      }),
      articlesCount: articlesCount
    })
  })
  .post(auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
      if (!user) {
        return res.sendStatus(401);
      }
      let article = new Article(req.body.article);
      article.author = user;
      return article.save()
        .then(function () {
          return res.json({ article: article.toJSON(user) });
        })
    }).catch(next);
  });

router
  .get('/feed', auth.required, function (req, res, next) {
    let limit = 20;
    let offset = 0;

    if (typeof req.query.limit !== 'undefined') {
      limit = req.query.limit;
    }

    if (typeof req.query.offset !== 'undefined') {
      offset = req.query.offset;
    }

    User.findById(req.payload.id).then(async function (user) {
      if (!user) { return res.sendStatus(401); }

      let articles = await Article.find({ author: { $in: user.following } })
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('author')
        .exec();
      let articlesCount = await Article.count({ author: { $in: user.following } });
      return res.json({
        articles: articles.map(function (article) {
          return article.toJSON(user);
        }),
        articlesCount: articlesCount
      });
    }).catch(next);
  });

router
  .route('/:article')
  .get(auth.optional, async function (req, res, next) {
    await User.findById(req.payload.id).then(async function (user) {
      req.payload = user;
      await req.article.populate('author').execPopulate();
      return res.json({ article: req.article.toJSON(user) });
    })
  })

  .put(auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
      if (req.article.author._id.toString() === req.payload.id.toString()) {
        if (req.body.article.title !== 'undefined') {
          req.article.title = req.body.article.title;
        }
        if (typeof req.body.article.body !== 'undefined') {
          req.article.body = req.body.article.body;
        }

        if (typeof req.body.article.tagList !== 'undefined') {
          req.article.tagList = req.body.article.tagList
        }
        req.article.save()
          .then(function (article) {
            res.send({ article: article.toJSON() });
          }).catch(next)
      } else {
        return res.sendStatus(403);
      }
    })
  })

  .delete(auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
      if (!user) {
        res.sendStatus(403);
      }
      if (req.article.author._id.toString() === req.payload.id.toString()) {
        return req.article.remove()
          .then(function () {
            return res.sendStatus(204);
          })
      } else {
        return res.sendStatus(403);
      }
    }).catch(next);
  })

router
  .route('/:articles/favorite')
  .post(auth.required, async function (req, res, next) {
    let articleSlug = req.params.articles;
    Article.findOne({ slug: articleSlug }).then(function (article) {
      User.findById(req.payload.id).then(function (user) {
        if (!user) { return res.sendStatus(401); }
        return user.favorite(article._id).then(function () {
          return article.updateFavoriteCount().then(function (article) {
            return res.json({ article: article.toJSON(user) });
          });
        });
      });
    }).catch(next);
  })
  .delete(auth.required, function (req, res, next) {
    let articleSlug = req.params.articles;
    Article.findOne({ slug: articleSlug }).then(function (article) {
      User.findById(req.payload.id).then(function (user) {
        if (!user) {
          return res.sendStatus(401);
        }
        return user.unfavorite(article._id).then(function () {
          return article.updateFavoriteCount().then(function (article) {
            return res.json({ article: article.toJSON(user) });
          });
        });
      });
    }).catch(next);
  })

router
  .route('/:article/comments')
  .get(auth.optional, async function (req, res, next) {
    let user = await req.payload ? User.findById(req.payload.id) : null;
    return req.article.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function (article) {
      return res.json({
        comments: req.article.comments.map(function (comment) {
          return comment.toJSON(user);
        })
      })
    }).catch(next);
  })
  .post(auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
      if (!user) {
        return res.sendStatus(401);
      }
      let comment = new Comment(req.body.comment);
      comment.author = user;
      comment.article = req.article;

      comment.save().then(function () {
        req.article.comments.push(comment);
        return req.article.save().then(function () {
          res.json({ comment: comment.toJSON(user) });
        })
      })
    })
  })
  .delete(auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
      if (req.comment.author.toString() === req.payload.id.toString()) {
        req.article.comments.remove(req.comment._id);
        req.article.save()
          .then(Comment.find({ _id: req.comment._id })
            .remove()
            .exec())
          .then(function () {
            res.sendStatus(204);
          });
      } else {
        res.sendStatus(403);
      }
    })
  })

module.exports = router;
