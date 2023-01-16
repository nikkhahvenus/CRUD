const { validationResult, matchedData } = require('express-validator');

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return { Value: value, Location: location , 'Error Messages': msg };
};

module.exports = function (req, res, next) {
    const allMatchedData = matchedData(req, { includeOptionals: true });

    const result = validationResult(req).formatWith(errorFormatter);
    const hasErrors = !result.isEmpty();
    if (hasErrors)
       return res.status(404).json({ errors: result.mapped() ,'All Matched Data': allMatchedData});
    next();
  }