const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
require('./models/User');
require('./models/Article');
require('./models/Comment');
require('./config/passport');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(morgan('dev'));
app.use(cors());
app.use(require('./routes'));

app.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

const mongoDB = 'mongodb+srv://user:user@cluster0.wsqb7.mongodb.net/tutorial?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true ,useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  console.log(err.stack);

  res.status(err.status || 500);

  res.json({'errors': {
      message: err.message,
      error: err
    }});
});

const server = app.listen(3000,function(){
    console.log("Server is listening on "+server.address().port);
});
