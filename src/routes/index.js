const sitesRouter = require('./sites');
const usersRouter = require('./user');
const apiRoute = require('./api/index');
const moduleTKRouter = require('./moduleTk');
const moduleTKBRouter = require('./moduleTKB');
const session = require('express-session');
const passport = require('passport');
const authenticateToken = require('../app/middleware/authenticateTokenAdmin');

function Route(app) {
    
    app.use(session({
        secret: process.env.JWT_SECRET_KEY, 
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } 
    }));
    // Cấu hình passport
    app.use(passport.initialize());
    app.use(passport.session());

    app.use((req, res, next) => {
        res.locals.isLoggedInUser = req.session.isLoggedInUser || false;
        res.locals.dataUser = req.session.dataUser || {};
        next();
    });
    
    app.use('/api', apiRoute);
    app.use('/users', authenticateToken, usersRouter);
    app.use('/thongke', authenticateToken, moduleTKRouter);
    app.use('/thoikhoabieu', authenticateToken, moduleTKBRouter);
    app.use('/', sitesRouter);
    

}


module.exports = Route;