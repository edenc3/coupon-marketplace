'use strict';

const express = require('express');
const path = require('path');

const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));


app.use('/api/admin', adminRoutes);

module.exports = app;
