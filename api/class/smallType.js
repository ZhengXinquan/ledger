const MODULE_NAME = 'aa_small_type'
const { RES, client, ObjectId, moment } = require('./utils')
class ClassName {
  constructor(TOKEN_USER_INFO) {
    this.DATABASE = client.db('hdm189315162_db')
    this.COLLECTION = this.DATABASE.collection(MODULE_NAME)
  }
  updatePXList(o) {
    return new Promise(async (resolve, reject) => {
      try {
        const ids = Object.keys(o)
        const len = ids.length
        for (let i = 0; i < len; i++) {
          const id_ = ids[i]
          const px_ = o[id_]

          const whereStr = { _id: new ObjectId(id_) }
          const updateStr = {
            $set: {
              spx: Number(px_)
            }
          }
          await this.COLLECTION.updateOne(whereStr, updateStr)
        }

        resolve(RES.success(MODULE_NAME + ' Succeed show '))
      } finally {
        resolve(RES.error(MODULE_NAME + ' show failed'))
        await client.close()
      }
    })
  }
  show(id_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) }
        const updateStr = {
          $set: {
            sshow: 1
          }
        }
        const result = await this.COLLECTION.updateOne(whereStr, updateStr)
        console.log('result')
        console.log(result)

        resolve(RES.success(MODULE_NAME + ' Succeed show '))
      } finally {
        resolve(RES.error(MODULE_NAME + ' show failed'))
        await client.close()
      }
    })
  }
  hide(id_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) }
        const updateStr = {
          $set: {
            sshow: 0
          }
        }
        const result = await this.COLLECTION.updateOne(whereStr, updateStr)
        console.log('result')
        console.log(result)

        resolve(RES.success(MODULE_NAME + ' Succeed hide '))
      } finally {
        resolve(RES.error(MODULE_NAME + ' hide failed'))
        await client.close()
      }
    })
  }
  delete(id_) {
    return new Promise(async (resolve, reject) => {
      try {
        let conditions = {
          _id: new ObjectId(id_)
        }

        const result = await this.COLLECTION.deleteOne(conditions)
        console.log(result, conditions)

        resolve(RES.success(MODULE_NAME + 'Succeed DELETE'))
      } finally {
        resolve(RES.error(MODULE_NAME + 'DELETE failed'))
        await client.close()
      }
    })
  }
  insert(sname_, bid_) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = {
          sname: sname_,
          _bid: new ObjectId(bid_),
          sshow: 1,
          spx: 0
        }
        const result = await this.COLLECTION.insertOne(doc)
        console.log('result')
        console.log(result)

        resolve(RES.success(MODULE_NAME + ' Succeed insert'))
      } finally {
        resolve(RES.error(MODULE_NAME + ' Insert failed'))
        await client.close()
      }
    })
  }
  updateName(id_, sname_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) }
        const updateStr = {
          $set: {
            sname: sname_
          }
        }
        const result = await this.COLLECTION.updateOne(whereStr, updateStr)
        console.log('result')
        console.log(result)

        resolve(RES.success(MODULE_NAME + ' Succeed updateName '))
      } finally {
        resolve(RES.error(MODULE_NAME + ' updateName failed'))
        await client.close()
      }
    })
  }
  updatePX(id_, spx_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) }
        const updateStr = {
          $set: {
            spx: Number(spx_)
          }
        }
        const result = await this.COLLECTION.updateOne(whereStr, updateStr)

        resolve(RES.success(MODULE_NAME + ' Succeed updatePX '))
      } finally {
        resolve(RES.error(MODULE_NAME + ' updatePX failed'))
        await client.close()
      }
    })
  }
  select(btype_ = 2, sshow_ = 1) {
    return new Promise(async (resolve, reject) => {
      try {
        let conditions = {
          btype: Number(btype_)
        }
        if (sshow_ !== false) {
          conditions['sshow'] = Number(sshow_)
        }
        const list = await this.COLLECTION.aggregate([
          {
            $lookup: {
              localField: '_bid', // 左集合 join 字段
              from: 'aa_big_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
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
              id: '$_id',
              bid: '$_bid',
              s: '$sshow',
              i: '$spx',
              n: '$sname',
              t: '$bigTypes.btype',
              bn: '$bigTypes.bname'
            }
          },
          {
            $sort: {
              spx: -1,
              i: -1
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
  selectAll(btype_ = 2) {
    return this.select(btype_, false)
  }
}

module.exports = ClassName
