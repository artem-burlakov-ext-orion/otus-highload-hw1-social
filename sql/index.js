const createPool = require('../db');

const pool = createPool();

const addUserToDb = async (user) => {
  const sql = `INSERT INTO users(name, surname, age, hobbies, gender, city, login, password)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  try {
    await pool.query(sql, Object.values(user));
  } catch (e) {
    return e;
  }
};

const getFriendsUserAdded = async (id) => {
  const sql = `SELECT u.id, f.userId=? AS isFriendForMe, u.name AS username, u.surname, u.age, u.hobbies, u.gender, u.city
                FROM users AS u LEFT JOIN friends AS f
                ON u.id = f.friendId
                WHERE f.userId=? AND u.id <> ?`;
  try {
    const friends = await pool.query(sql, [id, id, id]);
    return friends[0];
  } catch (e) {
    return e;
  }
};

const getUserMutualFriends = async (id) => {
  const sql = `SELECT u.id, f.friendId=? AS isFriendForMe, u.name AS username, u.surname, u.age, u.hobbies, u.gender, u.city 
                  FROM users AS u LEFT JOIN friends AS f
                  ON u.id = f.userId
                  WHERE f.friendId=? AND f.isMutual=?`;
  try {
    const mutualFriends = await pool.query(sql, [id, id, 1]);
    return mutualFriends[0];
  } catch (e) {
    return e;
  }
};

const getNotUserFriends = async (id, userFriendsId) => {
  let sql = `SELECT DISTINCT u.id, f.userId=? AS isFriendForMe, u.name AS username, u.surname, u.age, u.hobbies, u.gender, u.city
           FROM users AS u LEFT JOIN friends AS f
           ON u.id=f.friendId
           WHERE u.id<>?`;
  const data = [id, id];
  if (userFriendsId.length !== 0) {
    sql = `${sql} AND u.id NOT IN (?) LIMIT 10`;
    data.push(userFriendsId);
  }
  sql = `${sql} LIMIT 10`;
  try {
    const notUserFriends = await pool.query(sql, data);
    return notUserFriends[0];
  } catch (e) {
    return e;
  }
};

const findUserByLogin = async (login) => {
  const sql = `SELECT id, login, password
               FROM users
               WHERE login=?`;
  const data = [login];
  try {
    const user = await pool.query(sql, data);
    return user[0];
  } catch (e) {
    return e;
  }
};

const deleteMutualFriendsWhoAddedMeFirst = async (id, unFriendList) => {
  const sql = `UPDATE friends
               SET isMutual=?
               WHERE friendId=? AND isMutual=? AND userId IN (?)`;
  const data = [0, id, 1, unFriendList];
  try {
    await pool.query(sql, data);
  } catch (e) {
    return e;
  }
};

const getMutualFriendsIAddFirst = async (id, unFriendList) => {
  const sql = `SELECT friendId
               FROM friends
               WHERE userId=? AND isMutual=? AND friendId IN (?)`;
  const data = [id, 1, unFriendList];
  try {
    const mutualFriendsIAddedFirst = await pool.query(sql, data);
    return mutualFriendsIAddedFirst[0];
  } catch (e) {
    return e;
  }
};

const addMeAsFriendAndUnfriendListAsUser = async (toInsert) => {
  const sql = `INSERT INTO friends(userId, friendId)
               VALUES ?`;
  try {
    await pool.query(sql, [toInsert]);
  } catch (e) {
    return e;
  }
};

const deleteAllInUnfriendList = async (id, toDelete) => {
  const sql = `DELETE FROM friends
               WHERE userId=? AND friendId IN (?)`;
  const data = [id, toDelete];
  try {
    await pool.query(sql, data);
  } catch (e) {
    return e;
  }
};

const getAllNotMutualWhoAddedMeFirst = async (id, newFriendList) => {
  const sql = `SELECT id, userId
               FROM friends
               WHERE friendId=? AND isMutual=? AND userId IN (?)`;
  const data = [id, 0, newFriendList];
  try {
    const allWhoAddedMeFirst = await pool.query(sql, data);
    return allWhoAddedMeFirst[0];
  } catch (e) {
    return e;
  }
};

const getWhoInNewFriendListAndAddMeFirst = async (id, newFriendList) => {
  const sql = `SELECT id, userId 
               FROM friends
               WHERE friendId=? AND userId IN (?)`;
  try {
    const result = await pool.query(sql, [id, newFriendList]);
    return result[0];
  } catch (e) {
    return e;
  }
};

const updateNotMutualWhoAddedMeFirstToMutual = async (updateList) => {
  const sql = `UPDATE friends
               SET isMutual=?
               WHERE id IN (?)`;
  try {
    await pool.query(sql, [1, updateList]);
  } catch (e) {
    return e;
  }
};

const addAllWhoNotAddedMeFirst = async (toInsert) => {
  const sql = `INSERT INTO friends(userId, friendId)
               VALUES ?`;
  try {
    await pool.query(sql, [toInsert]);
  } catch (e) {
    return e;
  }
};

const getSearchResultSql = async (data) => {
  const sql = `SELECT id, name AS username, surname, age, hobbies, gender, city
               FROM users
               WHERE name LIKE ? AND surname LIKE ?
               ORDER BY id`;
  try {
    const result = await pool.query(sql, data);
    return result[0];
  } catch (e) {
    return e;
  }
};

module.exports = {
  addUserToDb,
  getFriendsUserAdded,
  getUserMutualFriends,
  getNotUserFriends,
  findUserByLogin,
  deleteMutualFriendsWhoAddedMeFirst,
  getMutualFriendsIAddFirst,
  addMeAsFriendAndUnfriendListAsUser,
  deleteAllInUnfriendList,
  getAllNotMutualWhoAddedMeFirst,
  updateNotMutualWhoAddedMeFirstToMutual,
  getWhoInNewFriendListAndAddMeFirst,
  addAllWhoNotAddedMeFirst,
  getSearchResultSql,
};
