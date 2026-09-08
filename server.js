'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`liquiditywatch static server running on port ${PORT}`);
});
