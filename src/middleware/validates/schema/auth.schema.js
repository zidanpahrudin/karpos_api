const menuPermissionSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', minLength: 24, maxLength: 24 },
        url: { type: 'string' },
    },
    required: ['id', 'url'],
    additionalProperties: false,
}

const user_login = { 
    type: 'object',
    properties: {
        username: { type: 'string', minLength: 9, maxLength: 14 },
        password: { type: 'string', minLength: 3, maxLength: 24 },
    },
    required: ['username', 'password'],
    additionalProperties: false,
}


module.exports = {
    menuPermissionSchema,
    user_login
};
