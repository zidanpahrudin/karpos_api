const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});
require('ajv-errors')(ajv);
ajv.addKeyword({
  keyword: 'isNotEmpty',
  validate: (schema, data) => {
    if (schema) {
      return typeof data === 'string' && data.trim() !== '';
    } else return true;
  },
});

function schemaValidate(args) {
  return async function(req, res, next) {
    try {
      const body_to_check = typeof req.body !== 'object' ? JSON.parse(req.body) : req.body;
      const header_to_check = typeof req.params !== 'object' ? JSON.parse(req.params) : req.params;
      const query_to_check = typeof req.query !== 'object' ? JSON.parse(req.query) : req.query;
      
      const validate = ajv.compile(args);
      const valid = validate({
        ...header_to_check, 
        ...body_to_check, 
        ...query_to_check
      });
      if (!valid) {
        const error = validate.errors[0];
        return res.status(400).json({
          status: 'failed',
          message: error.message,
          data: {
            path: error.instancePath,
            params: error.params,
            message: error.message,
          },
        });
      }
      next();
    } catch (err) {
      res.status(500).json({
        status: 'failed',
        message: 'Server error : ' + err.message,
        data: [],
      });
    }
  };
}
module.exports = schemaValidate;
