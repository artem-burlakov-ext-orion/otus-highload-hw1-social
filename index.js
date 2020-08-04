require('dotenv').config();
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const socialNetworkRoutes = require('./routes/index');
const createMysqlPool = require('./db');

const app = express();

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(socialNetworkRoutes);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await createMysqlPool();
    app.listen(PORT, () => {
      console.log(`Server has been started on port ${PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
})();
