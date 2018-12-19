const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser =  require('cookie-parser');
const socketIo = require('socket.io');

const indexRouter = require('./routes/index');
const messagesRouter = require('./routes/messages');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const io = socketIo();

// view engine setup
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.io = io;

app.use('/m-advisor-measure/',express.static(path.join(__dirname, 'public')));

app.use('/m-advisor-measure/', indexRouter);
app.use('/m-advisor-measure/messages/', messagesRouter(io));
app.use('/m-advisor-measure/dashboard/', dashboardRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
