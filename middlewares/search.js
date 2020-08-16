const { getSearchResultSql } = require('../sql/index');

const isSearchDataValid = (data) => data.userName.length > 0 || data.surName.length > 0;

const prepareSearchData = (data) => Object.values(data).map((elem) => `${elem}%`);

const getSearchResult = async (req, res, next) => {
  try {
    const searchData = {};
    searchData.userName = req.query.name || req.body.usernameSearch;
    searchData.surName = req.query.surname || req.body.surnameSearch;
    const data = {
      title: 'Search result',
    };
    if (!isSearchDataValid(searchData)) {
      data.users = [];
      data.err = 'No input data';
      res.render('search', data);
      return;
    }
    data.users = await getSearchResultSql(prepareSearchData(searchData));
    data.err = '';
    res.status(200);
    res.render('search', data);
  } catch (e) {
    next(e);
  }
};

module.exports = getSearchResult;
