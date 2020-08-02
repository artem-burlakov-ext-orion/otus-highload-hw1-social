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
           WHERE u.id <> ?`;
  let data = [id, id];
  
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

module.exports = {
  addUserToDb,
  getFriendsUserAdded,
  getUserMutualFriends,
  getNotUserFriends,
  findUserByLogin
}