require('dotenv').config();

const {Router} = require('express');

const router = Router();
const { 
  isAuth,
  register,
  getAllUsers,
  auth,
  logout
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

router.post('/auth', auth);

router.get('/users', isAuth, getAllUsers);
 
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'create anketa'
  });
});

router.get('/logout', logout, (req, res) => {
  res.redirect('/');
})

router.post('/register', register);
  

router.post('/friend', async (req, res) => {
  const id = req.session.userId;
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
      console.log('ADDFRIEND TOUPDATE', arrToUpdateUserIds);
    const arrToInsertFriendIds = toAddNewFriends
      .filter((elem) => !arrToUpdateUserIds.includes(elem));
    console.log('ADD FRIEND TO INSERT', arrToInsertFriendIds);
    
    if (arrToInsertFriendIds.length !== 0) {
      const sql5 = `INSERT INTO friends(userId, friendId)
                    VALUES ?`;
      let toInsertNotMutual = [];
      arrToInsertFriendIds.forEach((friendId) => {
        toInsertNotMutual.push([id, friendId]);
      });
      const data5 = toInsertNotMutual;
      console.log('ADD NOT MUTUAL TO INSERT', data5);
      const result = await pool.query(sql5, [data5]);
      console.log(result[0]);
    }
  }
  res.redirect('/users');
});

module.exports = router;
