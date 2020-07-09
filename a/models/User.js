const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secret = require('../config').secret;


var UserSchema = new mongoose.Schema({
    username: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
    email: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true },
    bio: String,
    image: String,
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hash: String,
    salt: String
}, { timestamps: true });

UserSchema.methods.setPassword = function (passwd) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(passwd, this.salt, 10000, 521, 'sha512').toString('hex');
}
UserSchema.methods.validatePassword = function (passwd) {
    let hash = crypto.pbkdf2Sync(passwd, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
}
UserSchema.methods.generateJWT = function () {
    let today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000)
    }, secret);
}
UserSchema.methods.toAuthJSON = function () {
    return {
        username: this.username,
        email: this.email,
        token: this.generateJWT,
        bio: this.bio,
        image: this.image
    }
}

UserSchema.methods.toProfileJSON = function (user) {
    return {
        username: this.username,
        bio: this.bio,
        image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
        following: user ? user.isFollowing(this._id) : false
    };
};

UserSchema.methods.favourite = function (id) {
    if (this.favourites.indexOf(id) === -1) {
        this.favourites.push(id);
    }
    return this.save();
}

UserSchema.methods.unfavourite = function (id) {
    this.favourites.remove(id);
    this.save();
}

UserSchema.methods.isFavourite = function (id) {
    return this.favourites.some(function (favouriteId) {
        return favouriteId.toString === id.toString();
    });
}

UserSchema.methods.follow = function (id) {
    if (this.following.indexIf(id) === -1) {
        this.following.push(id);
    }
    return this.save();
}

UserSchema.methods.unfollow = function (id) {
    this.following.remove(id);
    return this.save();
}

UserSchema.methods.isFollowing = function (id) {
    return this.following.some(function (followId) {
        return followId.toString() === id.toString();
    });
}
UserSchema.plugin(uniqueValidator, { message: 'is already taken' });

const user = mongoose.model('User', UserSchema);
const query = {},
    update = { expire: new Date() },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

user.findOneAndUpdate(query, update, options, function (err, result) {
    if (err) {
        return;
    }
});