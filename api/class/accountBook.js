const { client } = require('./mongodb')
const RES = require('../utils/res')
const moment = require('moment')
class ClassName {
  constructor(TOKEN_USER_INFO) {
    this.DATABASE = client.db('hdm189315162_db')
    this.COLLECTION = this.DATABASE.collection('aa_account_book')
  }
  selectBillByYear(year_) {
    return new Promise(async (resolve, reject) => {
      const conditions = {
        year: Number(year_)
      }
      let list = await this.COLLECTION.aggregate([
        {
          $addFields: {
            dayDate: {
              $dateFromString: {
                dateString: '$aday'
              }
            }
          }
        },
        {
          $addFields: {
            yearMonth: {
              $dateToString: {
                format: '%Y-%m',
                date: '$dayDate'
              }
            },
            year: { $year: { date: '$dayDate', timezone: '+0800' } },
            month: { $month: { date: '$dayDate', timezone: '+0800' } }
          }
        },
        {
          $match: conditions
        },
        {
          $group: {
            _id: '$yearMonth',
            pay: { $sum: '$amoney' },
            d: { $first: '$yearMonth' },
            year: { $first: '$year' },
            dayDate: { $first: '$dayDate' }
          }
        },

        {
          $lookup: {
            from: 'aa_income', // 右集合
            let: {
              account_book_yearMonth: '$_id'
            },
            pipeline: [
              {
                $addFields: {
                  dayDate: {
                    $dateFromString: {
                      dateString: '$iday'
                    }
                  }
                }
              },
              {
                $addFields: {
                  yearMonth: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: '$dayDate'
                    }
                  }
                }
              },
              {
                $match: {
                  $expr: {
                    $eq: ['$yearMonth', '$$account_book_yearMonth']
                  }
                }
              },
              {
                $group: {
                  _id: '$yearMonth',
                  income: { $sum: '$imoney' }
                }
              }
            ],
            as: 'incomes' // 新生成字段（类型array）
          }
        },
        {
          $lookup: {
            // localField: 'yearMonth', // 左集合 join 字段
            from: 'aa_pay_budget', // 右集合

            let: {
              account_book_yearMonth: '$_id'
            },
            pipeline: [
              {
                $addFields: {
                  dayDate: {
                    $dateFromString: {
                      dateString: '$pmonth'
                    }
                  }
                }
              },
              {
                $addFields: {
                  yearMonth: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: '$dayDate'
                    }
                  }
                }
              },
              {
                $match: {
                  $expr: {
                    $eq: ['$yearMonth', '$$account_book_yearMonth']
                  }
                }
              },

              {
                $group: {
                  _id: '$yearMonth',
                  budget: { $sum: '$pmoney' }
                }
              }
            ],
            // foreignField: 'yearMonth', // 右集合 join 字段
            as: 'budgets' // 新生成字段（类型array）
          }
        },

        {
          $project: {
            _id: 0,
            d: 1,
            pay: 1,
            year: 1,
            dayDate: 1,
            income: { $first: '$incomes.income' },
            budget: { $first: '$budgets.budget' }
          }
        },
        {
          $sort: {
            d: -1
          }
        }
      ]).toArray()

      list = list.map((e) => {
        return {
          ...e,

          income: e.income || 0,
          budget: e.budget || 0,
          lincome: (e.income || 0) - e.pay,
          lbudget: (e.budget || 0) - e.pay
        }
      })
      let sum1 = 0
      let sum2 = 0
      let sum3 = 0
      let sum4 = 0
      let sum5 = 0
      list.forEach((e) => {
        sum1 += e.pay
        sum2 += e.income
        sum3 += e.budget
        sum4 += e.lincome
        sum5 += e.lbudget
      })

      const res = {
        d: list,
        pay: sum1,
        income: sum2,
        budget: sum3,
        lincome: sum4,
        lbudget: sum5
      }

      console.log('selectBillByYear', list)
      resolve(RES.success(res))
    })
  }
  selectPayDetailBySidAndTime(sid_, time_, type_) {
    return new Promise(async (resolve, reject) => {
      try {
        let year_ = ''
        let month_ = ''
        let week_ = ''
        let conditions = {}

        if (type_ == 'week') {
          let time_arr = time_.split('-') //2020-42 2020年第42周 周一为一周的第一天
          year_ = Number(time_arr[0])
          sid_ = Number(sid_)
          conditions = {
            sid: sid_,
            weekYear: year_,
            week: week_
          }
        }
        if (type_ == 'month') {
          let time_arr = time_.split('-') ////2020-10
          year_ = Number(time_arr[0])
          month_ = Number(time_arr[1])
          sid_ = Number(sid_)
          conditions = {
            sid: sid_,
            year: year_,
            month: month_
          }
        }
        if (type_ == 'year') {
          year_ = Number(time_) //2020
          sid_ = Number(sid_)
          conditions = {
            sid: sid_,
            year: year_
          }
        }
        console.log(conditions)

        const list = await this.COLLECTION.aggregate([
          {
            $addFields: {
              dayDate: {
                $dateFromString: {
                  dateString: '$aday'
                }
              }
            }
          },
          {
            $addFields: {
              weekYear: { $isoWeekYear: { date: '$dayDate', timezone: '+0800' } },
              week: { $isoWeek: { date: '$dayDate', timezone: '+0800' } },
              year: { $year: { date: '$dayDate', timezone: '+0800' } },
              month: { $month: { date: '$dayDate', timezone: '+0800' } }
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
            $project: {
              //决定要显示的字段，相当于select的作用
              _id: 0,
              id: '$_id',
              // smallTypes: 1,
              // bigTypes: 1,
              tid: '$smallTypes.id',
              tn: '$smallTypes.sname',

              n: '$aname',
              m: '$amoney',
              d: '$aday',
              t: '$atime'
              // dd: '$dayDate',
              // y: '$year',
              // w: '$week'
            }
          },

          {
            $sort: {
              m: -1
            }
          }
        ]).toArray()

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

  insert(sid_, aname_, amoney, aday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = {
          sid: Number(sid_),
          aname: aname_,
          amoney: Number(amoney),
          aday: aday_,
          atime: moment().format('yyyy-MM-DD HH:mm:SS'),
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

  selectPayDetailByTime(time_, type_) {
    return new Promise(async (resolve, reject) => {
      try {
        let year_ = ''
        let month_ = ''
        let week_ = ''
        let conditions = {}

        if (type_ == 'week') {
          let time_arr = time_.split('-') //2020-42 2020年第42周 周一为一周的第一天
          year_ = Number(time_arr[0])
          week_ = Number(time_arr[1])
          conditions = {
            weekYear: year_,
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

        const list = await this.COLLECTION.aggregate([
          {
            $addFields: {
              dayDate: {
                $dateFromString: {
                  dateString: '$aday'
                }
              }
            }
          },
          {
            $addFields: {
              weekYear: { $isoWeekYear: { date: '$dayDate', timezone: '+0800' } },
              week: { $isoWeek: { date: '$dayDate', timezone: '+0800' } },
              year: { $year: { date: '$dayDate', timezone: '+0800' } },
              month: { $month: { date: '$dayDate', timezone: '+0800' } }
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
              id: '$_id',
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
              // dd: '$dayDate',
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
        ]).toArray()

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
        const accountIncomes = this.DATABASE.collection('aa_income')

        const time_arr = aday_.split('-') ////2020-10

        const conditions = {
          year: Number(time_arr[0]),
          month: Number(time_arr[1])
        }

        const list = await accountIncomes
          .aggregate([
            {
              $addFields: {
                dayDate: {
                  $dateFromString: {
                    dateString: '$iday'
                  }
                }
              }
            },
            {
              $addFields: {
                year: { $year: { date: '$dayDate', timezone: '+0800' } },
                month: { $month: { date: '$dayDate', timezone: '+0800' } }
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
                id: '$_id',
                bid: 1,
                tid: '$bigTypes.id',
                tt: '$bigTypes.btype',
                tn: '$bigTypes.bname',
                bn: '$bigTypes.bname',
                n: '$iname',
                m: '$imoney',
                d: '$iday',
                t: '$itime',
                dd: '$dayDate',
                y: '$year',
                w: '$week',
                rowType: 'income'
                // B_result: '$B_list.result'
              }
            }
          ])
          .toArray()

        const list2 = await this.COLLECTION.aggregate([
          {
            $addFields: {
              dayDate: {
                $dateFromString: {
                  dateString: '$aday'
                }
              }
            }
          },
          {
            $addFields: {
              year: { $year: { date: '$dayDate', timezone: '+0800' } },
              month: { $month: { date: '$dayDate', timezone: '+0800' } }
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
              id: '$_id',
              bid: '$big.id',
              tid: '$smallTypes.id',
              tn: '$smallTypes.sname',
              tt: '$bigTypes.btype',
              bn: '$bigTypes.bname',
              n: '$aname',
              m: '$amoney',
              d: '$aday',
              t: '$atime',
              dd: '$dayDate',
              y: '$year',
              w: '$week',
              rowType: 'a-book'
              // B_result: '$B_list.result'
            }
          }
        ]).toArray()
        const res = list.concat(list2)
        res.sort((a, b) => {
          return new Date(b.t) - new Date(a.t)
        })
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
