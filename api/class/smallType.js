const client = require('./mongodb')
const RES = require('../utils/res')
const moment = require('moment')
class ClassName {
  constructor(TOKEN_USER_INFO) {}
  add(o) {}

  select(btype_ = 2) {
    return new Promise(async (resolve, reject) => {
      // SELECT
      // s.id,s.bid,b.btype as t,s.sname as n,b.bname as bn,s.sshow as s,s.spx as i
      // From `aa_small_type` s
      //  LEFT JOIN `aa_big_type` b
      //  ON s.bid=b.id
      //   WHERE s.sshow = 1 AND b.btype = '$btype_'
      //   ORDER BY s.spx desc

      try {
        const database = client.db('hdm189315162_db')
        const CollectionObj = database.collection('aa_small_type')
        let year_ = ''
        let month_ = ''
        let week_ = ''
        let conditions = {
          sshow: 1,
          btype: btype_
        }
        const list = await CollectionObj.aggregate([
          {
            $lookup: {
              localField: 'bid', // 左集合 join 字段
              from: 'aa_big_type', // 右集合
              foreignField: 'id', // 右集合 join 字段
              as: 'bigTypes' // 新生成字段（类型array）
            }
          },
          { $unwind: '$bigTypes' },
          {
            $addFields: {
              btype: '$bigTypes.btype'
            }
          },
          {
            $match: conditions
          },
          {
            $project: {
              //决定要显示的字段，相当于select的作用
              _id: 0,
              id: 1,
              bid: 1,
              s: '$sshow',
              i: '$spx',
              n: '$sname',
              t: '$bigTypes.btype',
              bn: '$bigTypes.bname'
            }
          },
          {
            $sort: {
              spx: -1
            }
          }
        ]).toArray()
        resolve(RES.success(list))
      } finally {
        resolve(RES.error([]))
        await client.close()
      }
    })
  }
}

module.exports = ClassName
