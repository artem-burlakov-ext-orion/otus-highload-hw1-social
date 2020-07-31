const {
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
    const sql = `INSERT INTO users(name, surname, age, hobbies, gender, city, login, password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const data = Object.values(user);
    await pool.query(sql, data);
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

module.exports = {
  isAuth,
  register,
  getAllUsers,
}