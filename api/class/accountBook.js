const client = require('./mongodb')
const RES = require('../utils/res')
const moment = require('moment')
class ClassName {
  constructor(TOKEN_USER_INFO) {
    this.tableName = 'zz_book'
    this.defaultSalt = 'grxs'
  }
  add(o) {}

  selectPayDetailByTime(time_, type_) {
    return new Promise(async (resolve, reject) => {
      try {
        const database = client.db('hdm189315162_db')
        const accountBooks = database.collection('aa_account_book')
        let year_ = ''
        let month_ = ''
        let week_ = ''
        let conditions = {}

        if (type_ == 'week') {
          let time_arr = time_.split('-') //2020-42 2020年第42周 周一为一周的第一天
          year_ = Number(time_arr[0])
          week_ = Number(time_arr[1])
          conditions = {
            year: year_,
            week: week_
          }
        }
        if (type_ == 'month') {
          let time_arr = time_.split('-') ////2020-10
          year_ = Number(time_arr[0])
          month_ = Number(time_arr[1])
          conditions = {
            year: year_,
            month: month_
          }
        }
        if (type_ == 'year') {
          year_ = time_ //2020
          conditions = {
            year: Number(year_)
          }
        }
        console.log(conditions)

        const list = await accountBooks
          .aggregate([
            {
              $addFields: {
                adayDate: {
                  $dateFromString: {
                    dateString: '$aday'
                  }
                }
              }
            },
            {
              $addFields: {
                year: { $isoWeekYear: { date: '$adayDate', timezone: '+0800' } },
                week: { $isoWeek: { date: '$adayDate', timezone: '+0800' } },
                month: { $month: { date: '$adayDate', timezone: '+0800' } }
              }
            },
            {
              $match: conditions
            },
            {
              $lookup: {
                localField: 'sid', // 左集合 join 字段
                from: 'aa_small_type', // 右集合
                foreignField: 'id', // 右集合 join 字段
                as: 'smallTypes' // 新生成字段（类型array）
              }
            },
            { $unwind: '$smallTypes' },
            {
              $addFields: {
                bid: '$smallTypes.bid'
              }
            },
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
              $project: {
                //决定要显示的字段，相当于select的作用
                _id: 0,
                id: 1,
                // smallTypes: 1,
                // bigTypes: 1,
                tid: '$smallTypes.id',
                tn: '$smallTypes.sname',

                bid: '$bigTypes.id',
                bn: '$bigTypes.bname',

                n: '$aname',
                m: '$amoney',
                d: '$aday',
                t: '$atime'
                // dd: '$adayDate',
                // y: '$year',
                // w: '$week'
              }
            },

            {
              $sort: {
                d: -1,
                t: -1
              }
            }
          ])
          .toArray()

        const sum = list.reduce((pre, cur) => {
          return pre + Number(cur.m)
        }, 0)

        resolve(RES.success({ d: list, sum }))
      } finally {
        resolve(RES.error([]))
        await client.close()
      }
    })
  }
  /**
   *
   * @param {*} aday_   2023-05
   * @returns   RES
   */
  select(aday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const database = client.db('hdm189315162_db')
        const accountIncomes = database.collection('aa_income')
        const accountBooks = database.collection('aa_account_book')

        const time_arr = aday_.split('-') ////2020-10

        const conditions = {
          year: Number(time_arr[0]),
          month: Number(time_arr[1])
        }

        const list = await accountIncomes
          .aggregate([
            {
              $addFields: {
                adayDate: {
                  $dateFromString: {
                    dateString: '$aday'
                  }
                }
              }
            },
            {
              $addFields: {
                year: { $isoWeekYear: { date: '$adayDate', timezone: '+0800' } },
                month: { $month: { date: '$adayDate', timezone: '+0800' } }
              }
            },
            {
              $match: conditions
            },
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
              $project: {
                //决定要显示的字段，相当于select的作用
                _id: 0,
                id: 1,
                bid: 1,
                tid: '$bigTypes.id',
                tt: '$bigTypes.btype',
                tn: '$bigTypes.bname',
                bn: '$bigTypes.bname',
                n: '$iname',
                m: '$imoney',
                d: '$iday',
                t: '$itime',
                dd: '$adayDate',
                y: '$year',
                w: '$week',
                rowType: 'income'
                // B_result: '$B_list.result'
              }
            }
          ])
          .toArray()

        const list2 = await accountBooks
          .aggregate([
            {
              $addFields: {
                adayDate: {
                  $dateFromString: {
                    dateString: '$aday'
                  }
                }
              }
            },
            {
              $addFields: {
                year: { $isoWeekYear: { date: '$adayDate', timezone: '+0800' } },
                month: { $month: { date: '$adayDate', timezone: '+0800' } }
              }
            },
            {
              $match: conditions
            },
            {
              $lookup: {
                localField: 'sid', // 左集合 join 字段
                from: 'aa_small_type', // 右集合
                foreignField: 'id', // 右集合 join 字段
                as: 'smallTypes' // 新生成字段（类型array）
              }
            },
            { $unwind: '$smallTypes' },
            {
              $addFields: {
                bid: '$smallTypes.bid'
              }
            },
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
              $project: {
                //决定要显示的字段，相当于select的作用
                _id: 0,
                id: 1,
                bid: '$big.id',
                tid: '$smallTypes.id',
                tn: '$smallTypes.sname',
                tt: '$bigTypes.btype',
                bn: '$bigTypes.bname',
                n: '$aname',
                m: '$amoney',
                d: '$aday',
                t: '$atime',
                dd: '$adayDate',
                y: '$year',
                w: '$week',
                rowType: 'a-book'
                // B_result: '$B_list.result'
              }
            }
          ])
          .toArray()
        const res = list.concat(list2)
        res.sort((a, b) => {
          return new Date(b.d) - new Date(a.d)
        })
        resolve(RES.success(res))
      } finally {
        resolve(RES.error([]))
        await client.close()
      }
    })
  }
}

module.exports = ClassName
