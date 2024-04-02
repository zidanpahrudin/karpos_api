const menuUserSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', minLength: 24, maxLength: 24 },
    },
    required: ['id'],
    additionalProperties: false,
}

module.exports = {
    menuUserSchema
};
