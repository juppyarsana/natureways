'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const homepageRouter = require('./routes/homepage');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', homepageRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NatureWays frontend running at http://localhost:${PORT}`);
});
