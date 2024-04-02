const {body, validationResult, param} = require('express-validator');


exports.userValidation = () => {
    return [
        body('name').exists(),
        body('username').exists(),
        body('level_user').isIn([1,2,3]),
        body('password').exists(),
        body('is_active').exists().isIn([0,1]),
        // body('pic_input'),
        // body('input_time'),
        // body('pic_edit'),
        // body('edit_time')
      ]
      
}

exports.loginValidation = () => {
    return [
        body('username').exists(),
        body('password').exists(),
      ]
      
}

exports.addMenuValidation = () => {
    
    return [
        body('menu_name').exists(),
        body('url').exists(),
        body('icon').exists(),
        body('menu_group').exists(),
        body('no').exists(),
        body('is_active').exists().isIn([0,1])
    ]
}

exports.MenuUserValidation = () => {
    return [
        param('id').exists(),
        body('menu_id').exists()
    ]
}

exports.getCustomerIdValidation = () => {
    return [
        param('id').exists()
    ]
}

exports.addCustomerValidation = () => {
    return [
        body('customer_name').exists(),
        body('npwp').exists(),
        body('address').exists(),
        body('contact1').exists(),
        body('contact2').optional(),
        body('email').exists().isEmail(),
        // pic_sales
        // remarks
        body('is_active').exists().isInt().isIn([1,0])
        // pic_input
        // input_time
        // pic_edit
        // edit_time
    ]
}

exports.validate = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {

        let error = {};
        errors.array().map((err) => error[err.param] = err.msg);
        return res.status(422).json({error})
    }

    next();
}




