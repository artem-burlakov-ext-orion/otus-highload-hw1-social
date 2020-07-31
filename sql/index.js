const getFriendsUserAdded = async (id) => {
  const sql = `SELECT u.id, f.userId=? AS isFriendForMe, u.name, u.surname, u.age, u.hobbies, u.gender, u.city
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
  const sql = `SELECT u.id, f.friendId=? AS isFriendForMe, u.name, u.surname, u.age, u.hobbies, u.gender, u.city 
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
  const sql = `SELECT DISTINCT u.id, f.userId=? AS isFriendForMe, u.name, u.surname, u.age, u.hobbies, u.gender, u.city
               FROM users AS u LEFT JOIN friends AS f
               ON u.id = f.friendId
               WHERE u.id <> ? AND u.id NOT IN (?)`;
  data = [id, id, userFriendsId];
  try {
    const notUserFriends = await pool.query(sql, data);
    return notUserFriends[0];
   } catch (e) {
    return e;
  }
}

module.exports = {
  getFriendsUserAdded,
  getUserMutualFriends,
  getNotUserFriends
}