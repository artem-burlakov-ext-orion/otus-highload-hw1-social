const createPool = require('../db');

const pool = createPool();

const addUserToDb = async (user) => {
  const sql = `INSERT INTO users(name, surname, age, hobbies, gender, city, login, password)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const data = Object.values(user);
  await pool.query(sql, data);
};

const getFriendsUserAdded = async (id) => {
  const sql = `SELECT u.id, f.userId=? AS isFriendForMe, u.name AS username, u.surname, u.age, u.hobbies, u.gender, u.city
                FROM users AS u LEFT JOIN friends AS f
                ON u.id = f.friendId
                WHERE f.userId=? AND u.id <> ?`;
  const data = [id, id, id];
  try {
    const friends = await pool.query(sql, data);
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
  const data = [id, id, 1];
  try {
    const mutualFriends = await pool.query(sql, data);
    return mutualFriends[0];
  } catch (e) {
    return e;
  }
};

const getNotUserFriends = async (id, userFriendsId) => {
  let sql = `SELECT DISTINCT u.id, f.userId=? AS isFriendForMe, u.name AS username, u.surname, u.age, u.hobbies, u.gender, u.city
           FROM users AS u LEFT JOIN friends AS f
           ON u.id = f.friendId
           WHERE u.id <> ?
           LIMIT 10`;
  const data = [id, id];

  if (userFriendsId.length !== 0) {
    sql = `${sql} AND u.id NOT IN (?)`;
    data.push(userFriendsId);
  }

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
  const user = await pool.query(sql, data);
  return user[0];
};

const deleteMutualFriendsWhoAddedMeFirst = async (id, unFriendList) => {
  const sql = `UPDATE friends
               SET isMutual=?
               WHERE friendId=? AND isMutual=? AND userId IN (?)`;
  const data = [0, id, 1, unFriendList];
  await pool.query(sql, data);
};

const getMutualFriendsIAddFirst = async (id, unFriendList) => {
  const sql = `SELECT friendId
               FROM friends
               WHERE userId=? AND isMutual=? AND friendId IN (?)`;
  const data = [id, 1, unFriendList];
  const mutualFriendsIAddedFirst = await pool.query(sql, data);
  return mutualFriendsIAddedFirst[0];
};

const addMeAsFriendAndUnfriendListAsUser = async (toInsert) => {
  const sql = `INSERT INTO friends(userId, friendId)
               VALUES ?`;
  await pool.query(sql, [toInsert]);
};

const deleteAllInUnfriendList = async (id, toDelete) => {
  const sql = `DELETE FROM friends
               WHERE userId=? AND friendId IN (?)`;
  const data = [id, toDelete];
  await pool.query(sql, data);
};

const getAllNotMutualWhoAddedMeFirst = async (id, newFriendList) => {
  const sql = `SELECT id, userId
               FROM friends
               WHERE friendId=? AND isMutual=? AND userId IN (?)`;
  const data = [id, 0, newFriendList];
  const allWhoAddedMeFirst = await pool.query(sql, data);
  return allWhoAddedMeFirst[0];
};

const getWhoInNewFriendListAndAddMeFirst = async (id, newFriendList) => {
  const sql = `SELECT id, userId 
               FROM friends
               WHERE friendId=? AND userId IN (?)`;
  const data = [id, newFriendList];
  const result = await pool.query(sql, data);
  return result[0];
};

const updateNotMutualWhoAddedMeFirstToMutual = async (updateList) => {
  const sql = `UPDATE friends
               SET isMutual=?
               WHERE id IN (?)`;
  const data = [1, updateList];
  await pool.query(sql, data);
};

const addAllWhoNotAddedMeFirst = async (toInsert) => {
  console.log('TOINSERT', toInsert);
  const sql = `INSERT INTO friends(userId, friendId)
               VALUES ?`;
  await pool.query(sql, [toInsert]);
};

const getSearchResultSql = async (data) => {
  const sql = `SELECT id, name AS username, surname, age, hobbies, gender, city
               FROM users
               WHERE name LIKE ? AND surname LIKE ?
               LIMIT 10`;
  const result = await pool.query(sql, data);
  return result[0];
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
