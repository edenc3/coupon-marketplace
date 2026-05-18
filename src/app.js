'use strict';

const express = require('express');
const path = require('path');

const adminRoutes = require('./routes/admin.routes');
const resellerRoutes = require('./routes/reseller.routes');
const { globalErrorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/admin', adminRoutes);
app.use('/api/v1', resellerRoutes);

app.use(globalErrorHandler);

module.exports = app;
