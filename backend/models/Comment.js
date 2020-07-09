const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    body: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' }
}, { timestamps: true });


CommentSchema.methods.toJSON = function (user) {
    return {
        id: this._id,
        body: this.body,
        createdAt: this.createdAt,
        author: this.author.toProfileJSON(user)
    };
};

const comment =mongoose.model('Comment', CommentSchema);
const query = {},
    update = { expire: new Date() },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

    comment.findOneAndUpdate(query, update, options, function (err, result) {
    if (err) {
        return;
    }
});
