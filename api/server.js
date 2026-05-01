/*
- File: server.js
- Author: Elijah Heimsoth
- Date: 04/28/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Express bootstrap. Loads env vars, validates them,
configures middleware (CORS, JSON parsing, request logging), registers
carrier adapters in the carrier registry, mounts routers, attaches the
central error handler, and listens on PORT when run as the entry point.
Exports the app for chai-http tests.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { envCheck } = require('./lib/envCheck');
const authRouter = require('./routes/auth');
const packagesRouter = require('./routes/packages');
const exclusionsRouter = require('./routes/exclusions');
const gmailRouter = require('./routes/gmail');
const googleCallbackRouter = require('./routes/googleCallback');
const { errorHandler } = require('./middleware/errorHandler');
const { loadCarrierTemplates } = require('./lib/carrierTemplates');

// Carrier registry boot. Each adapter must be registered before any
// route handler can call registry.getTrackingInfoWithFallback().
const carrierRegistry = require('./lib/carriers/registry');
const fedexAdapter = require('./lib/carriers/fedex/adapter');
carrierRegistry.register(fedexAdapter);

envCheck();

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

app.use('/auth', authRouter);
app.use('/auth/google', googleCallbackRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/exclusions', exclusionsRouter);
app.use('/api/gmail', gmailRouter);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
if (require.main === module) {
    (async () => {
        try {
            await loadCarrierTemplates();
            app.listen(PORT, () => console.log(`Listening on ${PORT}`));
        } catch (err) {
            console.error('Failed to load carrier templates at boot:', err.message);
            process.exit(1);
        }
    })();
}

module.exports = app;
