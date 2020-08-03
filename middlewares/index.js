require('dotenv').config();
const bcrypt = require('bcrypt');

const {
  addUserToDb,
  getFriendsUserAdded,
  getNotUserFriends,
  getUserMutualFriends,
  findUserByLogin,
  deleteMutualFriendsWhoAddedMeFirst,
  getMutualFriendsIAddedFirst,
  addMeAsFriendAndUnfriendListAsUser,
  deleteAllInUnfriendList,
  getAllWhoInNewFriendListAndAddedMeFirst,
  updateNotMutualWhoAddedMeFirstToMutual,
  addAllWhoNotAddedMeFirst
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
    const hashedPassword = await bcrypt.hash(req.body.password, Number(process.env.BCRYPT_SALT_ROUNDS));
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

const getUnfriendList = (data) => {
  const result =  Array.isArray(data) ? data : [data];
  return result
    .filter((id, i) => id !=='x' && data[i + 1] !=='x')
    .map((id) => Number(id));
};

const getInsertData = (friendsList) => {
  let insertData = [];
  if (friendsList.length !== 0 ) {
    const friendsIdList = friendsList
      .map((friend) => friend.friendId);
    friendsIdList.forEach((friendId) => {
      insertData.push([friendId, id]);
    });
  }
  return insertData;
};

const allDeleteFriendsOpsDone = async (id, unFriendList) => {
  if (unFriendList.length === 0) {
    return;
  }
  try {
    await deleteMutualFriendsWhoAddedMeFirst(id, unFriendList);
    const mutualFriendsIaddedFirstLocatedInUnfriendList = await getMutualFriendsIAddedFirst(id, unFriendList);
    const insertData = getInsertData(mutualFriendsIaddedFirstLocatedInUnfriendList);
    if (insertData.length !==0 ) {
      await addMeAsFriendAndUnfriendListAsUser(insertData);
    }
    await deleteAllInUnfriendList(id, unFriendList);
  } catch (e) {
    return e;
  }
};

const deleteFriends = async (req, res, next) => {
  const { unFriendData } = req.body;
  if (!unFriendData) {
    next();
    return;
  }
  const unFriendList = getUnfriendList(unFriendData);
  console.log('UNFRIEND_LIST', unFriendList);
  try {
    await allDeleteFriendsOpsDone(req.session.userId, unFriendList);
    next();
  } catch (e) {
    return e;
  }
};

const addFriends = async (req, res, next) => {
  const { newFriends } = req.body;
  if (!newFriends) {
    next();
    return;
  }
  console.log('NEWF', newFriends);
  const newFriendArr = Array.isArray(newFriends) ? newFriends : [newFriends];
  const newFriendList = newFriendArr.map((newFriend) => Number(newFriend));
  console.log('TOADD', newFriendList);
  if(newFriendList.length === 0 ) {
    next();
    return;
  }
  const whoAddedMeAndInNewFriendList = await getAllWhoInNewFriendListAndAddedMeFirst(req.session.userId, newFriendList);
  const updateListIds = whoAddedMeAndInNewFriendList
    .map((elem) => elem.id);
  const excludeListUserIds = whoAddedMeAndInNewFriendList
    .map((elem) => elem.userId);
  if (updateListIds.length !== 0) {
    await updateNotMutualWhoAddedMeFirstToMutual(updateListIds);
  }
  const insertListFriendIds = newFriendList
    .filter((newFriendId) => !excludeListUserIds.includes(newFriendId));
  if (insertListFriendIds.length !== 0 ) {
    let toInsert = [];
    insertListFriendIds.forEach((friendId) => {
      toInsert.push([req.session.userId, friendId]);
    });
    await addAllWhoNotAddedMeFirst(toInsert);
  }
  next();
};


module.exports = {
  isAuth,
  registerUser,
  getAllUsers,
  checkUser,
  logoutUser,
  loginUser,
  deleteFriends,
  addFriends
}
