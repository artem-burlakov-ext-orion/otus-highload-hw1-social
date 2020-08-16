require('dotenv').config();
const bcrypt = require('bcrypt');

const {
  addUserToDb,
  getFriendsUserAdded,
  getNotUserFriends,
  getUserMutualFriends,
  findUserByLogin,
  deleteMutualFriendsWhoAddedMeFirst,
  getMutualFriendsIAddFirst,
  addMeAsFriendAndUnfriendListAsUser,
  deleteAllInUnfriendList,
  getWhoInNewFriendListAndAddMeFirst,
  updateNotMutualWhoAddedMeFirstToMutual,
  addAllWhoNotAddedMeFirst,
} = require('../sql/index');

const isAuth = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
    return;
  }
  res.render('login');
};

const setHashedPassword = async (user, password) => {
  const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS));
  return { ...user, password: hashedPassword };
};

const registerUser = async (req, res, next) => {
  try {
    const user = {
      name: req.body.name,
      surname: req.body.surname,
      age: req.body.age,
      hobbies: req.body.hobbies,
      gender: req.body.gender,
      city: req.body.city,
      login: req.body.login,
    };
    const { password } = req.body;

    await addUserToDb(await setHashedPassword(user, password));

    res.status = 201;
    res.redirect('/');
  } catch (e) {
    next(e);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { userId, login } = req.session;
    const data = {};
    data.title = 'Social network';
    data.login = login;
    const friendsUserAdded = await getFriendsUserAdded(userId);
    const mutualFriends = await getUserMutualFriends(userId);
    const userFriends = friendsUserAdded.concat(mutualFriends);
    const userFriendsId = userFriends.map((friends) => friends.id);
    const notUserFriends = await getNotUserFriends(userId, userFriendsId);
    data.users = userFriends.concat(notUserFriends);
    res.status(200);
    res.render('index', data);
  } catch (e) {
    next(e);
  }
};

const isUserExist = (user) => user.length !== 0;

const isPasswordCorrect = async (inputPassword, userPassword) => {
  try {
    const isCorrect = await bcrypt.compare(inputPassword, userPassword);
    return isCorrect;
  } catch (e) {
    return e;
  }
};

const isUserCorrect = async (user, inputPassword) => {
  try {
    return isUserExist(user) && await isPasswordCorrect(inputPassword, user[0].password);
  } catch (e) {
    return e;
  }
};

const loginUser = (req, res, next) => {
  req.session.loggedIn = true;
  req.session.login = req.session.user.login;
  req.session.userId = req.session.user.id;
  res.redirect('/users');
  next();
};

const checkUser = async (req, res, next) => {
  const { login: inputLogin, password: inputPassword } = req.body;
  try {
    const user = await findUserByLogin(inputLogin);
    if (await isUserCorrect(user, inputPassword)) {
      [req.session.user] = user;
      next();
      return;
    }
    res.status = 401;
    res.send('Incorrect Username and/or Password!');
  } catch (e) {
    next(e);
  }
};

const logoutUser = (req, res, next) => {
  req.session.destroy();
  res.status = 200;
  res.redirect('/');
  next();
};

const getUnfriendList = (data) => {
  const result = Array.isArray(data) ? data : [data];
  return result
    .filter((id, i) => id !== 'x' && data[i + 1] !== 'x')
    .map((id) => Number(id));
};

const getInsertData = (friendsList, id) => {
  const insertData = [];
  if (friendsList.length !== 0) {
    const friendsIdList = friendsList
      .map((friend) => friend.friendId);
    friendsIdList.forEach((friendId) => {
      insertData.push([friendId, id]);
    });
  }
  return insertData;
};

const allDeleteFriendsOps = async (id, unFriendList) => {
  if (unFriendList.length === 0) {
    return;
  }
  try {
    await deleteMutualFriendsWhoAddedMeFirst(id, unFriendList);
    const friendsIaddFirstAndInUnfriendList = await getMutualFriendsIAddFirst(id, unFriendList);
    const insertData = getInsertData(friendsIaddFirstAndInUnfriendList, id);
    if (insertData.length !== 0) {
      await addMeAsFriendAndUnfriendListAsUser(insertData);
    }
    await deleteAllInUnfriendList(id, unFriendList);
  } catch (e) {
    console.error(e);
  }
};

const deleteFriends = async (req, res, next) => {
  const { unFriendData } = req.body;
  if (!unFriendData) {
    next();
    return;
  }
  const unFriendList = getUnfriendList(unFriendData);
  try {
    await allDeleteFriendsOps(req.session.userId, unFriendList);
    next();
  } catch (e) {
    next(e);
  }
};

const allAddFriendsOps = async (userId, newFriendList) => {
  try {
    const addMeFirstList = await getWhoInNewFriendListAndAddMeFirst(userId, newFriendList);
    const updateListIds = addMeFirstList
      .map((elem) => elem.id);
    const excludeListUserIds = addMeFirstList
      .map((elem) => elem.userId);
    if (updateListIds.length !== 0) {
      await updateNotMutualWhoAddedMeFirstToMutual(updateListIds);
    }
    const insertListFriendIds = newFriendList
      .filter((newFriendId) => !excludeListUserIds.includes(newFriendId));
    if (insertListFriendIds.length !== 0) {
      const toInsert = [];
      insertListFriendIds.forEach((friendId) => {
        toInsert.push([userId, friendId]);
      });
      await addAllWhoNotAddedMeFirst(toInsert);
    }
  } catch (e) {
    console.error(e);
  }
};

const addFriends = async (req, res, next) => {
  const { newFriends } = req.body;
  if (!newFriends) {
    next();
    return;
  }
  const newFriendArr = Array.isArray(newFriends) ? newFriends : [newFriends];
  const newFriendList = newFriendArr.map((newFriend) => Number(newFriend));
  if (newFriendList.length === 0) {
    next();
    return;
  }
  try {
    await allAddFriendsOps(req.session.userId, newFriendList);
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = {
  isAuth,
  registerUser,
  getAllUsers,
  checkUser,
  logoutUser,
  loginUser,
  deleteFriends,
  addFriends,
};
