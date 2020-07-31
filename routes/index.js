require('dotenv').config();
const bcrypt = require('bcrypt');
const {Router} = require('express');
const router = Router();
const { 
  isAuth,
  register,
  getAllUsers,
 } = require('../middlewares/index');
const session = require('express-session');

router.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true
}));

router.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/users');
    return;
  }
  res.render('login');
});

router.post('/auth', async (req, res) => {
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
    console.log(e);
  } 
});

router.get('/users', isAuth, getAllUsers);
 
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'create anketa'
  });
});

router.post('/register', register);
  

router.post('/friend', async (req, res) => {
  const id = req.session.userid;
  const { friendsData, newFriends } = req.body;
  console.log('DATA', friendsData);
  if (friendsData) {
    const arr = Array.from(friendsData);
    const toDelete = arr
      .filter((id, ind) => id !=='x' && friendsData[ind + 1] !=='x')
      .map((id) => Number(id));
    console.log('TODELETE', toDelete);
    if (toDelete.length !== 0) {

      //update friends if user add me and isMutual=1
      const updateSql = `UPDATE friends
                         SET isMutual=?
                         WHERE friendId=? AND isMutual=? AND userId IN (?)`;
      const updateData = [0, id, 1, toDelete];
      await pool.query(updateSql, updateData);

      const sql = `SELECT friendId FROM friends
                   WHERE userId=? AND isMutual=? AND friendId IN (?)`;
      const data = [id, 1, toDelete];
      const mutualFriends = await pool.query(sql, data);

      if (mutualFriends[0].length !== 0 ) {
        const arrMutualFriendIds = mutualFriends[0].map((friendId) => friendId.friendId);
        let toInsert = [];
        arrMutualFriendIds.forEach((friendId) => {
          toInsert.push([friendId, id])
        })
        const sql1 = `INSERT INTO friends(userId, friendId)
                        VALUES ?`; 
        const data1 = toInsert;
        await pool.query(sql1, [data1]);
      }
      
      const sql2 = `DELETE FROM friends
                    WHERE userId=? AND friendId IN (?)`;
      const data2 = [id, toDelete];
      await pool.query(sql2, data2);
    }
  }
  if (newFriends) {
    const toAddNewFriends = Array.from(newFriends)
      .map((newFriend) => Number(newFriend));
    console.log('TOADD', toAddNewFriends);
    
    const sql3 = `SELECT id, userId FROM friends
                 WHERE friendId=? AND isMutual=? AND userId IN (?)`;
    const data3 = [id, 0, toAddNewFriends];
    const toUpdate = await pool.query(sql3, data3);
    console.log('MUTUAL', toUpdate[0]);

    if (toUpdate[0].length !== 0) {
      const arrToUpdateIds = toUpdate[0].map((toUpdateObj) => toUpdateObj.id);
      const sql4 = `UPDATE friends
                    SET isMutual=?
                    WHERE id IN (?)`; 
      const data4 = [1, arrToUpdateIds];
      await pool.query(sql4, data4);
    }

    const arrToUpdateUserIds = toUpdate[0]
      .map((toUpdateObj) => toUpdateObj.userId);
      console.log(arrToUpdateUserIds);
    const arrToInsertFriendIds = toAddNewFriends
      .filter((elem) => !arrToUpdateUserIds.includes(elem));
    console.log(arrToInsertFriendIds);
    
    if (arrToInsertFriendIds.length !== 0) {
      const sql5 = `INSERT INTO friends(userId, friendId)
                    VALUES ?`;
      let toInsertNotMutual = [];
      arrToInsertFriendIds.forEach((friendId) => {
        toInsertNotMutual.push([id, friendId]);
      });
      const data5 = toInsertNotMutual;
      console.log(data5);
      const result = await pool.query(sql5, [data5]);
      console.log(result[0]);
    }
  }
  res.redirect('/users');
});

module.exports = router;
