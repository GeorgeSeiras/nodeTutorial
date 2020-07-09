const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var slug = require('slug');
var User = mongoose.model('User');

var ArticleSchema = new mongoose.Schema({
    slug: { type: String, lowercase: true, unique: true },
    title: String,
    description: String,
    body: String,
    favouritesCount: { type: Number, default: 0 },
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

ArticleSchema.methods.updateFavouriteCount = function(){
    const article = this;
    return User.count({favourites:{$in:[article._id]}})
        .then(function(count){
            article.favouritesCount = count;
            return article.save();
        })
}

ArticleSchema.methods.toJSONFor = function(user){
    return {
      slug: this.slug,
      title: this.title,
      description: this.description,
      body: this.body,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tagList: this.tagList,
      favourited: user ? user.isFavourite(this._id) : false,
      favouritesCount: this.favouritesCount,
      author: this.author.toProfileJSONFor(user)
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

