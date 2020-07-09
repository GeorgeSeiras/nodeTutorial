const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');
const User = mongoose.model('User');

let ArticleSchema = new mongoose.Schema({
    slug: { type: String, lowercase: true, unique: true },
    title: String,
    description: String,
    body: String,
    favoritesCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    tagList: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken' });

ArticleSchema.pre('validate', function (next) {
    if (!this.slug) {
        this.slugify();
    }
    next();
});

ArticleSchema.methods.slugify = function() {
    this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
  };

ArticleSchema.methods.updateFavoriteCount = function(){
    let article = this;
    return User.count({favorites:{$in:[article._id]}})
        .then(function(count){
            article.favoritesCount = count;
            return article.save();
        })
}

ArticleSchema.methods.toJSON = function(user){
  let tmpAuthor = new User();
  tmpAuthor.username = this.author.username;
  tmpAuthor.bio = this.author.bio;
  tmpAuthor.image = this.author.image;
  tmpAuthor.following = this.author.following;
    return {
      slug: this.slug,
      title: this.title,
      description: this.description,
      body: this.body,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tagList: this.tagList,
      favorited: user ? user.isFavorite(this._id) : false,
      favoritesCount: this.favoritesCount,
      author: tmpAuthor
    };
  };

const article =mongoose.model('Article', ArticleSchema);
const query = {},
    update = { expire: new Date() },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

    article.findOneAndUpdate(query, update, options, function (err, result) {
    if (err) {
        return;
    }
});

