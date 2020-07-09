const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
require('./models/User');
require('./models/Article');
//require('./models/Comment');
require('./config/passport');
const routes = require("./routes");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(routes);
app.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

var mongoDB = 'mongodb://127.0.0.1/tutorial';
mongoose.connect(mongoDB, { useNewUrlParser: true ,useNewUrlParser: true, useUnifiedTopology: true});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(function(err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });
const server = app.listen(process.env.PORT || 3000,function(){
    console.log("Server is listening on "+server.address().port);
});