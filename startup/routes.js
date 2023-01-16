
const home = require('../routes/home');
const admin = require('../routes/admin');
const adminCategory = require('../routes/admin/category');
const adminItem = require('../routes/admin/item');
//const auth = require('../routes/auth');

const { error1, error2 } = require('../middleware/error');

const express = require('express');
//const connect_db_reconnect = require('./db_reconnect');
//const routerLogger = require('../middleware/loggerRouter');

module.exports = function (app) {
        // for parsing application/json
    app.use(express.json()) 
        // for parsing application/x-www-form-urlencoded
    app.use(express.urlencoded({ extended: true })) 

    //app.use(routerLogger);
    app.use('/api/home', home);
    app.use('/api/admin/item', adminItem);
    app.use('/api/admin/category', adminCategory);
    app.use('/api/admin', admin);

 //   app.use('/api/auth', auth);
    app.use(error1);
    app.use(error2);
}