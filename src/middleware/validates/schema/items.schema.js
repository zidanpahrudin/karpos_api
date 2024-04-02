const itemSchema = {
    type: 'string',
    minLength: 24,
    maxLength: 24,
};

const bundleItemSchema = {
    _id: itemSchema,
    qty: itemSchema,
    price_sell: itemSchema,
};

module.exports = {
    add: {
        type: 'object',
        properties: {
            id: itemSchema,
            items_code: itemSchema,
            items_name: itemSchema,
            items_info: itemSchema,
            items_unit_id: itemSchema,
            items_category: itemSchema,
            items_merk: itemSchema,
            price_buy: itemSchema,
            price_sell: itemSchema,
            is_active: itemSchema,
            pic_input: itemSchema,
            replace_id: itemSchema,
            is_bundling: itemSchema,
            bundle_items: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: bundleItemSchema,
                    additionalProperties: false,
                },
            },
        },
        additionalProperties: false,
    },
};
