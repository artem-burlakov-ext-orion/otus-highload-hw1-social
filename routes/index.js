require('dotenv').config();
const {Router} = require('express');
const session = require('express-session');

const { 
  isAuth,
  registerUser,
  getAllUsers,
  checkUser,
  logoutUser,
  loginUser,
  deleteFriends,
  addFriends
 } = require('../middlewares/index');

const router = Router();

router.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true
}));

router.get('/', isAuth, (req, res) => {
  res.redirect('/users');
});

router.post('/auth', checkUser, loginUser);

router.get('/users', isAuth, getAllUsers);
 
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'create anketa'
  });
});

router.get('/logout', isAuth, logoutUser);

router.post('/register', registerUser);

router.post('/friend', deleteFriends, addFriends, (req, res) => {
  res.redirect('/users');
});

module.exports = router;
