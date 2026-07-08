'use strict';

require('dotenv').config();
const path = require('path');
const express = require('express');
const homepageRouter = require('./routes/homepage');
const articleRouter = require('./routes/article');
const pillarRouter = require('./routes/pillar');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', homepageRouter);
app.use('/', articleRouter);
app.use('/', pillarRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NatureWays frontend running at http://localhost:${PORT}`);
});
