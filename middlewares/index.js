const bcrypt = require('bcrypt');

const {
  addUserToDb,
  getFriendsUserAdded,
  getNotUserFriends,
  getUserMutualFriends,
  findUserByLogin
} = require('../sql/index');


const isAuth = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
    return;
  }
  res.render('login');
};

const registerUser = async (req, res, next) => {
  try {
    const { login, name, surname, age, hobbies, gender, city } = req.body;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { name, surname, age, hobbies, gender, city, login, password: hashedPassword };
    await addUserToDb(user);
    res.redirect('/');
  } catch (e) {
    return e;
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { userId, login } = req.session;
    const friendsUserAdded = await getFriendsUserAdded(userId);
    const mutualFriends = await getUserMutualFriends(userId);
    const userFriends = friendsUserAdded.concat(mutualFriends);
    const userFriendsId = userFriends.map((friends) => friends.id);
    const notUserFriends = await getNotUserFriends(userId, userFriendsId);
    console.log('IADD', friendsUserAdded);
    console.log('MUTUAL', mutualFriends);
    console.log('NOT', notUserFriends);
    const users = userFriends.concat(notUserFriends);

    res.render('index', {
      title: 'Social network',
      users,
      login
    });
  } catch (e) {
    return e;
  }
};

const isUserExist = (user) => {
  return user.length !== 0;
};

const isPasswordCorrect = async (inputPassword, userPassword) => {
  try {
    const isCorrect = await bcrypt.compare(inputPassword, userPassword);
    return isCorrect;
  } catch (e) {
    return e;
  }
};

const isUserCorrect = async (user, inputPassword) => {
  return isUserExist(user) && await isPasswordCorrect(inputPassword, user[0].password);
};

const loginUser = (req, res, next) => {
  req.session.loggedIn = true;
  req.session.login = req.session.user.login;
  req.session.userId = req.session.user.id;
  res.redirect('/users');
};

const checkUser = async (req, res, next) => {
  const { login: inputLogin, password: inputPassword } = req.body;
  try {
    const user = await findUserByLogin(inputLogin);
    if (await isUserCorrect(user, inputPassword)) {
      req.session.user = user[0];
      next();
      return;
    }
    res.send('Incorrect Username and/or Password!');
  } catch(e) {
    return e;
  } 
};

const logoutUser = (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
};

module.exports = {
  isAuth,
  registerUser,
  getAllUsers,
  checkUser,
  logoutUser,
  loginUser
}
