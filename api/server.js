/*
- File: server.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Express bootstrap. Loads env vars, validates them,
configures middleware (CORS, JSON parsing, request logging), mounts
routers, attaches the central error handler, and listens on PORT
when run as the entry point. Exports the app for chai-http tests.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { envCheck } = require('./lib/envCheck');
const authRouter = require('./routes/auth');
const packagesRouter = require('./routes/packages');
const exclusionsRouter = require('./routes/exclusions');
const { errorHandler } = require('./middleware/errorHandler');

envCheck();

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

app.use('/auth', authRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/exclusions', exclusionsRouter);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
if (require.main === module) {
    app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

module.exports = app;
