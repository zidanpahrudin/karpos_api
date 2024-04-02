const warehouseId = {
    type: 'object',
    properties: {
        id: { type: 'string', minLength: 24, maxLength: 24 }
    },
    additionalProperties: false,
}

const warehouse = {
    type: 'object',
    properties: {
        warehouse_name: { type: 'string', minLength: 5, maxLength: 24 },
        warehouse_code: { type: 'string' },
        address: { type: 'string', minLength: 3, maxLength: 24 },
        telp: { type: 'string' },
        city: { type: 'string' },
        remarks: { type: 'string' },
        pic_input: { type: 'string' },
        input_time: { type: 'string' },
        pic_edit: { type: 'string' },
        edit_time: { type: 'string' }
    },
    required: ['warehouse_name', 'warehouse_code', 'address', 'telp', 'city'],
    additionalProperties: false,
}

module.exports = {
    warehouseId,
    warehouse
};
