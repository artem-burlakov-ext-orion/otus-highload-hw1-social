const { getSearchResultSql } = require('../sql/index');

const isSearchDataValid = (data) => data.userName.length > 0 || data.surName.length > 0;

const prepareSearchData = (data) => Object.values(data).map((elem) => `${elem}%`);

const getSearchResult = async (req, res, next) => {
  try {
    const data = {};
    data.userName = req.query.name || req.body.usernameSearch;
    data.surName = req.query.surname || req.body.surnameSearch;
    console.log("DATA", data);

    if (!isSearchDataValid(data)) {
      res.render('search', {
        title: 'Search result',
        users: [],
        err: 'No input data',
      });
      return;
    }
    const result = await getSearchResultSql(prepareSearchData(Object.values(data)));
    res.status(200);
    res.render('search', {
      title: 'Search result',
      users: result,
      err: '',
    });
  } catch (e) {
    next(e);
  }
};

module.exports = getSearchResult;
