const bcrypt = require('bcrypt');

const {
  addUser,
  getFriendsUserAdded,
  getNotUserFriends,
  getUserMutualFriends
} = require('../sql/index');


const isAuth = async (req, res, next) => {
  console.log('REQ.SESSION.LOGGEDIN', req.session.loggedIn);
  if (req.session.loggedIn) {
    next();
    return;
  }
  res.redirect('/');
};


const register = async (req, res, next) => {
  try {
    const { login, name, surname, age, hobbies, gender, city } = req.body;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { name, surname, age, hobbies, gender, city, login, password: hashedPassword };
    await addUser(user);
    res.redirect('/');
  } catch (e) {
    console.log(e);
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

const auth = async (req, res, next) => {
  const { login, password } = req.body;
  try {
    const sql = `SELECT id, login, password
                 FROM users
                 WHERE login=?`;
    const data = [login];
    const user = await pool.query(sql, data);
    if ((user[0].length !== 0) && (await bcrypt.compare(password, user[0][0].password))) {
      req.session.loggedIn = true;
      req.session.login = login;
      req.session.userId = user[0][0].id;
      console.log('AUTH', req.session);
      res.redirect('/users');
      return;
    }
    res.send('Incorrect Username and/or Password!');
  } catch(e) {
    return e;
  } 
};

const logout = (req, res, next) => {
  console.log('LOGOUT');
  req.session.destroy();
  next();
};

module.exports = {
  isAuth,
  register,
  getAllUsers,
  auth,
  logout
}