const client = require('./mongodb')
const RES = require('../utils/res')
const moment = require('moment')
class ClassName {
  constructor(TOKEN_USER_INFO) {
    this.DATABASE = client.db('hdm189315162_db')
    this.COLLECTION = this.DATABASE.collection('aa_income')
  }
  insert(bid_, iname_, imoney, iday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = {
          bid: Number(bid_),
          iname: iname_,
          imoney: Number(imoney),
          iday: iday_,
          itime: moment().format('yyyy-MM-DD HH:mm:SS'),
          cid: 0
        }
        const result = await this.COLLECTION.insertOne(doc)
        console.log('result')
        console.log(result)

        resolve(RES.success('Succeed insert account_book '))
      } finally {
        resolve(RES.error('Insert failed'))
        await client.close()
      }
    })
  }

  select(btype_ = 2) {
    return new Promise(async (resolve, reject) => {
      /**
       * SELECT
       * id,
       * btype as t,
       * bname as n,
       * bname as bn,
       * bshow as s ,
       * bpx as i
       *
       * From `aa_big_type`
       *
       * WHERE bshow = 1 AND btype = '$btype_'
       *
       *  ORDER BY bpx desc
       */

      try {
        let year_ = ''
        let month_ = ''
        let week_ = ''
        let conditions = {
          bshow: 1,
          btype: btype_
        }
        const options = {
          sort: { bpx: -1 },
          projection: {
            _id: 0,
            id: '_id',
            t: '$btype',
            n: '$bname',
            bn: '$bname',
            s: '$bshow',
            i: '$bpx'
          }
        }

        const list = await this.COLLECTION.find(conditions, options).toArray()
        resolve(RES.success(list))
      } finally {
        resolve(RES.error([]))
        await client.close()
      }
    })
  }
}

module.exports = ClassName
