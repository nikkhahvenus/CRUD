const validate = ( validator ) => {
    return (req, res, next) => {
       const error = validator(req.body);
       if (error) return res.status(400).send({error: error.details[0].message});
       //if (error) return res.status(400).send(error.message);
       next();
    }
 };

 module.exports = validate;