
const mongoose = require('mongoose');
const moment = require("moment");
const connectionManager = require("../middleware/db");
module.exports = {
  getItems: async (req, res) => {
    try {
      const connectionDB = req.user.database_connection;
      const Items = require('../models/MstItems')(connectionManager.getConnection(connectionDB));
      let dataResult = [];
      const { id } = req.query;
      if (id) {
        await Items.aggregate(
          [
            { "$match": { 
              "_id": mongoose.Types.ObjectId(id),
              "is_active": 1
            } },
            {
              '$graphLookup': {
                'from': 'mst_items_unit',
                'startWith': '$items_unit_id',
                'connectFromField': '_id',
                'connectToField': '_id',
                'as': 'items_unit'
              }
            }, {
              '$graphLookup': {
                'from': 'mst_items_category',
                'startWith': '$items_category',
                'connectFromField': '_id',
                'connectToField': '_id',
                'as': 'category'
              }
            }, {
              '$project': {
                'items_unit._id': 0,
                'category._id': 0
              }
            }, {
              '$unwind': {
                'path': '$items_unit'
              }
            }, {
              '$unwind': {
                'path': '$category'
              }
            }, {
              '$replaceWith': {
                'data': {
                  '$mergeObjects': [
                    {
                      '_id': '$_id',
                      'items_code': '$items_code',
                      'items_name': '$items_name',
                      'items_info': '$items_info',
                      'items_category': '$items_category',
                      'items_unit_id': '$items_unit_id',
                      'price_buy': '$price_buy',
                      'price_sell': '$price_sell',
                      'is_active': '$is_active',
                      'pic_input': '$pic_input',
                      'input_time': '$input_time',
                      'edit_time': '$edit_time',
                      'createdAt': '$createdAt',
                      'updatedAt': '$updatedAt',
                      'replace_id': '$replace_id'
                    }, '$items_unit', '$category',
  
                  ]
                }
              }
            }
          ]
        ).exec(async (err, data) => {
          if (err) return res.status(400).json({ message: "Error : " + err.message })
          if (data) {
            if (!data.length > 0) {
              return res.json({ status: 'Success', message: 'tidak terdapat data items', data: data })
            }
          } else {
            return res.json({ status: 'Success', message: 'tidak terdapat data items', data: [] })
          }
  
          res.json({ status: 'Success', message: 'berhasil mendapatkan data items', data: data })
        });
      }
      else {
        await Items.aggregate(
          [
            {
              $match: {
                is_active: 1
              }
            },
            {
              $sort: {
                createdAt: -1
              }
            },
  
            {
              '$graphLookup': {
                'from': 'mst_items_unit',
                'startWith': '$items_unit_id',
                'connectFromField': '_id',
                'connectToField': '_id',
                'as': 'items_unit'
              }
            }, {
              '$graphLookup': {
                'from': 'mst_items_category',
                'startWith': '$items_category',
                'connectFromField': '_id',
                'connectToField': '_id',
                'as': 'category'
              }
            }, {
              '$project': {
                'items_unit._id': 0,
                'category._id': 0
              }
            }, {
              '$unwind': {
                'path': '$items_unit'
              }
            }, {
              '$unwind': {
                'path': '$category'
              }
            }, {
              '$replaceWith': {
                'data': {
                  '$mergeObjects': [
                    {
                      '_id': '$_id',
                      'items_code': '$items_code',
                      'items_name': '$items_name',
                      'items_info': '$items_info',
                      'items_category': '$items_category',
                      'price_buy': '$price_buy',
                      'price_sell': '$price_sell',
                      'is_active': '$is_active',
                      'pic_input': '$pic_input',
                      'input_time': '$input_time',
                      'edit_time': '$edit_time',
                      'createdAt': '$createdAt',
                      'updatedAt': '$updatedAt',
                      'replace_id': '$replace_id'
                    }, '$items_unit', '$category'
                  ]
                }
              }
            }
          ]
        ).exec(async (err, data) => {
          if (err) return res.status(400).json({ message: "Error : " + err.message })
          if (!data.length > 0) {
            return res.json({ status: 'Success', message: 'tidak terdapat data items', data: data })
          }
  
          for await (const result of data) {
            dataResult.push(result.data)
          }
          res.json({ status: 'Success', message: 'berhasil mendapatkan data items', data: dataResult })
        });
      }
    } catch (err) {
      res.json({ message: 'server error : ' + err.message })
    }
  
  },
  
  /**
   * controller items/
   * @return {Object} - menambahkan items
   */
  addItems: async (req, res) => {
    try {
      const connectionDB = req.user.database_connection;
      const Items = require('../models/MstItems')(connectionManager.getConnection(connectionDB));
      const ItemsUnit = require('../models/MstItemsUnit')(connectionManager.getConnection(connectionDB));
      const ItemsCategory = require('../models/MsItemsCategory')(connectionManager.getConnection(connectionDB));
      const {
        is_bundling,
        bundle_items,
        items_name,
        replace_id,
        items_info,
        items_unit_id,
        items_category,
        items_merk,
        price_buy,
        price_sell,
        is_active,
        pic_input,
        input_time
      } = req.body;
    
      const obj_items = {};
      const item_detail_bundle = [];
      let sumAmountItems = 0;
      if(replace_id) {
        const replace_item = await Items.findOne({is_active: 1, _id: replace_id}).lean();
        if(replace_item) obj_items.replace_id = replace_item._id;
      }
      if(items_unit_id) {
        const items_unit = await ItemsUnit.findOne({is_active: 1, _id: items_unit_id}).lean();
        if(items_unit) obj_items.items_unit_id = items_unit._id; 
      }
      if(items_category) {
        const items_category_id = await ItemsCategory.findOne({is_active: 1, _id: items_category}).lean();
        if(items_category_id) obj_items.items_category = items_category_id._id;
      }

      if (bundle_items && bundle_items.length > 0) {
        // Extracting all _id values from bundle_items to fetch details in bulk
        const itemIds = bundle_items.map(bundle_item => bundle_item._id);
      
        // Fetching all items details in bulk
        const itemsDetails = await Items.find({ _id: { $in: itemIds } });
      
        const itemsMap = new Map(itemsDetails.map(item => [item._id.toString(), item]));
      
        // Update bundle_items based on fetched details
        bundle_items.forEach(bundle_item => {
          const itemDetail = itemsMap.get(bundle_item._id.toString());
      
          if (itemDetail) {
            bundle_item.items_id = itemDetail._id;
            bundle_item.items_name = itemDetail.items_name;
            bundle_item.items_unit_id = itemDetail.items_unit_id;
            // bundle_item.items_unit_name = itemDetail.items_unit_name;
            bundle_item.qty = bundle_item.qty;
            bundle_item.price_buy = itemDetail.price_buy * bundle_item.qty;
            bundle_item.price_sell = bundle_item.price_sell;
            item_detail_bundle.push(bundle_item);
            
            sumAmountItems += itemDetail.price_buy * bundle_item.qty;
          }
        });
      }

      sumAmountItems =  price_buy;

      obj_items.is_bundling = is_bundling;
      obj_items.bundle_items = bundle_items;
      obj_items.items_name = items_name;
      obj_items.items_info = items_info;
      obj_items.items_merk = items_merk;
      obj_items.price_buy = sumAmountItems;
      obj_items.price_sell = price_sell;
      obj_items.is_active = is_active;
      obj_items.pic_input = pic_input;
      obj_items.input_time = input_time;



      let newItems = new Items(obj_items);
  
      const new_item= await newItems.save();
      return res.json({
        status: 'Success',
        message: 'data berhasil di simpan',
        data: new_item
      });
    } catch (err) {
      res.json({
        status: "failed",
        message: 'server error : ' + err.message,
        data: [],
    })
    }
  },
  
  updateItems: async (req, res) => {
    try {
      const connectionDB = req.user.database_connection;
      const Items = require('../models/MstItems')(connectionManager.getConnection(connectionDB));
      let update = req.body;
      await Items.findOneAndUpdate({ _id: req.params.id }, update, { new: true }).exec((err, data) => {
        if (err) return res.status(400).json({ status: 'Error', message: "gagal mengupdate data", data: [] })
  
        res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })
  
      })
    } catch (err) {
      return res.json({ message: 'server error : ' + err.message })
    }
  },
  
  deleteItems: async (req, res) => {
    try {
      const connectionDB = req.user.database_connection;
      const Items = require('../models/MstItems')(connectionManager.getConnection(connectionDB));
      await Items.findOneAndUpdate({ _id: req.params.id }, { is_active: 0 }, { new: true }).exec((err, data) => {
        if (err) return res.status(400).json({ status: 'Error', message: "gagal menghapus data", data: [] })
  
        res.json({ status: 'Success', message: 'data berhasil di hapus', data: [] })
  
      })
    } catch (err) {
      return res.json({ message: 'server error : ' + err.message })
    }
  },
}


