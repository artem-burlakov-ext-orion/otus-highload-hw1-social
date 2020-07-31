require('dotenv').config();
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const startMySqlPool = require('./db');
const socialNetworkRoutes = require('./routes/index');

const app = express();

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs'
})

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');


app.use(express.urlencoded({ extended:true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(socialNetworkRoutes);

const PORT = process.env.APP_PORT || 80;

async function main() {
  try {
    await startMySqlPool();
    app.listen(PORT, () => {
      console.log(`Server has been started on port ${process.env.APP_PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};

main();
