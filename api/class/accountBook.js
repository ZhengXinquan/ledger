const { RES, client, ObjectId, moment } = require('./utils');
const MODULE_NAME = 'aa_account_book';
class ClassName {
  constructor(TOKEN_USER_INFO) {
    this.DATABASE = client().db('hdm189315162_db');
    this.COLLECTION = this.DATABASE.collection('aa_account_book');
    this.LOG = this.DATABASE.collection('aa_log');
  }
  /**
   *
   * @param {*} to_id
   * @param {*} to_name
   * @param {*} to_num
   * @param {*} to_info_json
   */
  async log(title, tid, d) {
    const doc = {
      title,
      tid,
      d,
      time: new Date(),
    };
    const result = await this.LOG.insertOne(doc);
    console.log('log result');
    console.log(result);
  }
  selectBillByYear(year_) {
    return new Promise(async (resolve, reject) => {
      const conditions = {
        year: Number(year_),
      };
      let list = await this.COLLECTION.aggregate([
        {
          $addFields: {
            yearMonth: {
              $dateToString: {
                format: '%Y-%m',
                date: '$_aday',
                timezone: '+0800',
              },
            },
            year: { $year: { date: '$_aday', timezone: '+0800' } },
            month: { $month: { date: '$_aday', timezone: '+0800' } },
          },
        },
        {
          $match: conditions,
        },
        {
          $group: {
            _id: '$yearMonth',
            pay: { $sum: '$amoney' },
            d: { $first: '$yearMonth' },
          },
        },

        {
          $lookup: {
            from: 'aa_income', // 右集合
            let: {
              account_book_yearMonth: '$_id',
            },
            pipeline: [
              {
                $addFields: {
                  yearMonth: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: '$_iday',
                      timezone: '+0800',
                    },
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ['$yearMonth', '$$account_book_yearMonth'],
                  },
                },
              },
              {
                $group: {
                  _id: '$yearMonth',
                  income: { $sum: '$imoney' },
                },
              },
            ],
            as: 'incomes', // 新生成字段（类型array）
          },
        },
        {
          $lookup: {
            // localField: 'yearMonth', // 左集合 join 字段
            from: 'aa_pay_budget', // 右集合

            let: {
              account_book_yearMonth: '$_id',
            },
            pipeline: [
              {
                $addFields: {
                  yearMonth: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: '$_pmonth',
                      timezone: '+0800',
                    },
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ['$yearMonth', '$$account_book_yearMonth'],
                  },
                },
              },

              {
                $group: {
                  _id: '$yearMonth',
                  budget: { $sum: '$pmoney' },
                },
              },
            ],
            // foreignField: 'yearMonth', // 右集合 join 字段
            as: 'budgets', // 新生成字段（类型array）
          },
        },

        {
          $project: {
            _id: 0,
            d: 1,
            pay: 1,
            income: { $first: '$incomes.income' },
            budget: { $first: '$budgets.budget' },
          },
        },
        {
          $sort: {
            d: -1,
          },
        },
      ]).toArray();

      list = list.map(e => {
        return {
          ...e,

          income: e.income || 0,
          budget: e.budget || 0,
          lincome: (e.income || 0) - e.pay,
          lbudget: (e.budget || 0) - e.pay,
        };
      });
      let sum1 = 0;
      let sum2 = 0;
      let sum3 = 0;
      let sum4 = 0;
      let sum5 = 0;
      list.forEach(e => {
        sum1 += e.pay;
        sum2 += e.income;
        sum3 += e.budget;
        sum4 += e.lincome;
        sum5 += e.lbudget;
      });

      const res = {
        d: list,
        pay: sum1,
        income: sum2,
        budget: sum3,
        lincome: sum4,
        lbudget: sum5,
      };

      console.log('selectBillByYear', list);
      resolve(RES.success(res));
    });
  }
  selectPayDetailBySidAndTime(sid_, time_, type_) {
    return new Promise(async (resolve, reject) => {
      try {
        const time_arr = time_.split('-');
        const year_ = Number(time_arr[0]);
        const month_ = Number(time_arr[1]); //2020-10  2020年10月
        const week_ = Number(time_arr[1]); //2020-42 2020年第42周 周一为一周的第一天
        const _sid = new ObjectId(sid_);
        const conditions = { _sid };

        if (type_ == 'week') {
          conditions['weekYear'] = year_;
          conditions['week'] = week_;
        }
        if (type_ == 'month') {
          conditions['year'] = year_;
          conditions['month'] = month_;
        }
        if (type_ == 'year') {
          conditions['year'] = year_;
        }
        console.log(conditions);

        const list = await this.COLLECTION.aggregate([
          {
            $addFields: {
              weekYear: { $isoWeekYear: { date: '$_aday', timezone: '+0800' } },
              week: { $isoWeek: { date: '$_aday', timezone: '+0800' } },
              year: { $year: { date: '$_aday', timezone: '+0800' } },
              month: { $month: { date: '$_aday', timezone: '+0800' } },
            },
          },
          {
            $match: conditions,
          },
          {
            $lookup: {
              localField: '_sid', // 左集合 join 字段
              from: 'aa_small_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
              as: 'smallTypes', // 新生成字段（类型array）
            },
          },
          { $unwind: '$smallTypes' },
          {
            $project: {
              _id: 0,
              id: '$_id',
              tid: '$smallTypes._id',
              tn: '$smallTypes.sname',

              n: '$aname',
              m: '$amoney',
              d: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$_aday',
                  timezone: '+0800',
                },
              },
              t: {
                $dateToString: {
                  format: '%Y-%m-%d %H:%M:%S',
                  date: '$_atime',
                  timezone: '+0800',
                },
              },
            },
          },

          {
            $sort: {
              m: -1,
            },
          },
        ]).toArray();

        const sum = list.reduce((pre, cur) => {
          return pre + Number(cur.m);
        }, 0);

        resolve(RES.success({ d: list, sum }));
      } finally {
        resolve(RES.error([]));
        // await client.close();
      }
    });
  }

  selectPayDetailByTime(time_, type_) {
    return new Promise(async (resolve, reject) => {
      try {
        let year_ = '';
        let month_ = '';
        let week_ = '';
        let conditions = {};

        if (type_ == 'week') {
          let time_arr = time_.split('-'); //2020-42 2020年第42周 周一为一周的第一天
          year_ = Number(time_arr[0]);
          week_ = Number(time_arr[1]);
          conditions = {
            weekYear: year_,
            week: week_,
          };
        }
        if (type_ == 'month') {
          let time_arr = time_.split('-'); ////2020-10
          year_ = Number(time_arr[0]);
          month_ = Number(time_arr[1]);
          conditions = {
            year: year_,
            month: month_,
          };
        }
        if (type_ == 'year') {
          year_ = time_; //2020
          conditions = {
            year: Number(year_),
          };
        }
        console.log(conditions);

        const list = await this.COLLECTION.aggregate([
          {
            $addFields: {
              weekYear: { $isoWeekYear: { date: '$_aday', timezone: '+0800' } },
              week: { $isoWeek: { date: '$_aday', timezone: '+0800' } },
              year: { $year: { date: '$_aday', timezone: '+0800' } },
              month: { $month: { date: '$_aday', timezone: '+0800' } },
            },
          },
          {
            $match: conditions,
          },
          {
            $lookup: {
              localField: '_sid', // 左集合 join 字段
              from: 'aa_small_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
              as: 'smallTypes', // 新生成字段（类型array）
            },
          },
          { $unwind: '$smallTypes' },
          {
            $addFields: {
              _bid: '$smallTypes._bid',
            },
          },
          {
            $lookup: {
              localField: '_bid', // 左集合 join 字段
              from: 'aa_big_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
              as: 'bigTypes', // 新生成字段（类型array）
            },
          },
          { $unwind: '$bigTypes' },
          {
            $project: {
              //决定要显示的字段，相当于select的作用
              _id: 0,
              id: '$_id',
              // smallTypes: 1,
              // bigTypes: 1,
              tid: '$smallTypes._id',
              tn: '$smallTypes.sname',

              bid: '$bigTypes._id',
              bn: '$bigTypes.bname',

              n: '$aname',
              m: '$amoney',
              d: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$_aday',
                  timezone: '+0800',
                },
              },
              t: {
                $dateToString: {
                  format: '%Y-%m-%d %H:%M:%S',
                  date: '$_atime',
                  timezone: '+0800',
                },
              },
              // dd: '$dayDate',
              // y: '$year',
              // w: '$week'
            },
          },

          {
            $sort: {
              d: -1,
              t: -1,
            },
          },
        ]).toArray();

        const sum = list.reduce((pre, cur) => {
          return pre + Number(cur.m);
        }, 0);

        resolve(RES.success({ d: list, sum }));
      } finally {
        resolve(RES.error([]));
        // await client.close();
      }
    });
  }
  search(start_, end_, word_, bn_, sn_) {
    return new Promise(async (resolve, reject) => {
      try {
        // 日期范围
        let dayMatch = null;
        if (start_ || end_) {
          dayMatch = {};
          const start = start_ ? new Date(start_ + ' 00:00:00') : null;
          const end = end_ ? new Date(end_ + ' 23:59:59') : null;
          if (start) dayMatch['$gte'] = start;
          if (end) dayMatch['$lte'] = end;
        }
        // 模糊搜索名称
        const wordMatch = word_
          ? {
              $regex: word_,
            }
          : null;

        /************ 收入 ******************** */
        const accountIncomes = this.DATABASE.collection('aa_income');
        const incomeConditions1 = {};
        if (dayMatch) incomeConditions1['_iday'] = dayMatch;
        if (wordMatch) incomeConditions1['iname'] = wordMatch;
        const incomeConditions2 = {};
        if (bn_) incomeConditions2['bigTypes.bname'] = bn_;

        const list = await accountIncomes
          .aggregate([
            {
              $match: incomeConditions1,
            },
            {
              $lookup: {
                localField: '_bid', // 左集合 join 字段
                from: 'aa_big_type', // 右集合
                foreignField: '_id', // 右集合 join 字段
                as: 'bigTypes', // 新生成字段（类型array）
              },
            },
            { $unwind: '$bigTypes' },
            {
              $match: incomeConditions2,
            },
            {
              $project: {
                //决定要显示的字段，相当于select的作用
                _id: 0,
                id: '$_id',
                bid: '$_bid',
                tid: '$_bid',
                tt: '$bigTypes.btype',
                tn: '$bigTypes.bname',
                bn: '$bigTypes.bname',
                n: '$iname',
                m: '$imoney',
                d: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$_iday',
                    timezone: '+0800',
                  },
                },
                t: {
                  $dateToString: {
                    format: '%Y-%m-%d %H:%M:%S',
                    date: '$_itime',
                    timezone: '+0800',
                  },
                },
                rowType: 'income',
              },
            },
          ])
          .toArray();

        /************ 支出 ******************** */
        const conditions1 = {};
        if (dayMatch) conditions1['_aday'] = dayMatch;
        if (wordMatch) conditions1['aname'] = wordMatch;
        const conditions2 = {};
        if (bn_) conditions2['bigTypes.bname'] = bn_;
        if (sn_) conditions2['smallTypes.sname'] = sn_;

        const list2 = await this.COLLECTION.aggregate([
          {
            $match: conditions1,
          },
          {
            $lookup: {
              localField: '_sid', // 左集合 join 字段
              from: 'aa_small_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
              as: 'smallTypes', // 新生成字段（类型array）
            },
          },
          { $unwind: '$smallTypes' },
          {
            $addFields: {
              _bid: '$smallTypes._bid',
            },
          },
          {
            $lookup: {
              localField: '_bid', // 左集合 join 字段
              from: 'aa_big_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
              as: 'bigTypes', // 新生成字段（类型array）
            },
          },
          { $unwind: '$bigTypes' },
          {
            $match: conditions2,
          },
          {
            $project: {
              //决定要显示的字段，相当于select的作用
              _id: 0,
              id: '$_id',
              bid: '$_bid',
              tid: '$smallTypes._id',
              tn: '$smallTypes.sname',
              tt: '$bigTypes.btype',
              bn: '$bigTypes.bname',
              n: '$aname',
              m: '$amoney',
              d: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$_aday',
                  timezone: '+0800',
                },
              },
              t: {
                $dateToString: {
                  format: '%Y-%m-%d %H:%M:%S',
                  date: '$_atime',
                  timezone: '+0800',
                },
              },
              rowType: 'a-book',
              // B_result: '$B_list.result'
            },
          },
        ]).toArray();

        const res = list.concat(list2);
        res.sort((a, b) => {
          return new Date(b.t) - new Date(a.t);
        });
        res.sort((a, b) => {
          return new Date(b.d) - new Date(a.d);
        });
        resolve(RES.success(res));
      } finally {
        resolve(RES.error([]));
        // await client.close();
      }
    });
  }
  /**
   *
   * @param {*} aday_   2023-05
   * @returns   RES
   */
  select(aday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const accountIncomes = this.DATABASE.collection('aa_income');

        const time_arr = aday_.split('-'); ////2020-10

        const conditions = {
          year: Number(time_arr[0]),
          month: Number(time_arr[1]),
        };

        const list = await accountIncomes
          .aggregate([
            {
              $addFields: {
                year: { $year: { date: '$_iday', timezone: '+0800' } },
                month: { $month: { date: '$_iday', timezone: '+0800' } },
              },
            },
            {
              $match: conditions,
            },
            {
              $lookup: {
                localField: '_bid', // 左集合 join 字段
                from: 'aa_big_type', // 右集合
                foreignField: '_id', // 右集合 join 字段
                as: 'bigTypes', // 新生成字段（类型array）
              },
            },
            { $unwind: '$bigTypes' },
            {
              $project: {
                //决定要显示的字段，相当于select的作用
                _id: 0,
                id: '$_id',
                bid: '$_bid',
                tid: '$bigTypes._id',
                tt: '$bigTypes.btype',
                tn: '$bigTypes.bname',
                bn: '$bigTypes.bname',
                n: '$iname',
                m: '$imoney',
                d: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$_iday',
                    timezone: '+0800',
                  },
                },
                t: {
                  $dateToString: {
                    format: '%Y-%m-%d %H:%M:%S',
                    date: '$_itime',
                    timezone: '+0800',
                  },
                },
                rowType: 'income',
                // B_result: '$B_list.result'
              },
            },
          ])
          .toArray();

        const list2 = await this.COLLECTION.aggregate([
          {
            $addFields: {
              year: { $year: { date: '$_aday', timezone: '+0800' } },
              month: { $month: { date: '$_aday', timezone: '+0800' } },
            },
          },
          {
            $match: conditions,
          },
          {
            $lookup: {
              localField: '_sid', // 左集合 join 字段
              from: 'aa_small_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
              as: 'smallTypes', // 新生成字段（类型array）
            },
          },
          { $unwind: '$smallTypes' },
          {
            $addFields: {
              _bid: '$smallTypes._bid',
            },
          },
          {
            $lookup: {
              localField: '_bid', // 左集合 join 字段
              from: 'aa_big_type', // 右集合
              foreignField: '_id', // 右集合 join 字段
              as: 'bigTypes', // 新生成字段（类型array）
            },
          },
          { $unwind: '$bigTypes' },
          {
            $project: {
              //决定要显示的字段，相当于select的作用
              _id: 0,
              id: '$_id',
              bid: '$_bid',
              tid: '$smallTypes._id',
              tn: '$smallTypes.sname',
              tt: '$bigTypes.btype',
              bn: '$bigTypes.bname',
              n: '$aname',
              m: '$amoney',
              d: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$_aday',
                  timezone: '+0800',
                },
              },
              t: {
                $dateToString: {
                  format: '%Y-%m-%d %H:%M:%S',
                  date: '$_atime',
                  timezone: '+0800',
                },
              },
              rowType: 'a-book',
              // B_result: '$B_list.result'
            },
          },
        ]).toArray();
        const res = list.concat(list2);
        res.sort((a, b) => {
          return new Date(b.t) - new Date(a.t);
        });
        res.sort((a, b) => {
          return new Date(b.d) - new Date(a.d);
        });
        resolve(RES.success(res));
      } finally {
        resolve(RES.error([]));
        // await client.close();
      }
    });
  }

  delete(id_) {
    return new Promise(async (resolve, reject) => {
      try {
        let conditions = {
          _id: new ObjectId(id_),
        };

        const result = await this.COLLECTION.deleteOne(conditions);
        console.log(result, conditions);
        this.log('delete ' + MODULE_NAME, new ObjectId(id_), result);

        resolve(RES.success(MODULE_NAME + 'Succeed DELETE'));
      } finally {
        resolve(RES.error(MODULE_NAME + 'DELETE failed'));
        // await client.close();
      }
    });
  }
  updateDetail(id_, aname_, amoney_, aday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            aname: aname_,
            amoney: Number(amoney_),
            aday: aday_,
            _aday: new Date(aday_),
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);
        this.log('updateDetail ' + MODULE_NAME, new ObjectId(id_), {
          aname: aname_,
          amoney: Number(amoney_),
          aday: aday_,
          _aday: new Date(aday_),
        });

        resolve(RES.success('Succeed updateDetail budget '));
      } finally {
        resolve(RES.error('updateDetail failed'));
        // await client.close();
      }
    });
  }
  updateType(id_, sid_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            _sid: new ObjectId(sid_),
            sid: sid_,
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);

        this.log('updateType ' + MODULE_NAME, new ObjectId(id_), { _sid: new ObjectId(sid_) });

        resolve(RES.success('Succeed updateType budget '));
      } finally {
        resolve(RES.error('updateType failed'));
        // await client.close();
      }
    });
  }
  insert(sid_, aname_, amoney, aday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = {
          sid: sid_,
          _sid: new ObjectId(sid_),
          aname: aname_,
          amoney: Number(amoney),
          aday: aday_,
          _aday: new Date(aday_),
          atime: moment().format('YYYY-MM-DD HH:mm:SS'),
          _atime: new Date(),
          cid: 0,
        };
        const result = await this.COLLECTION.insertOne(doc);
        console.log('result');
        console.log(result);

        this.log('insert ' + MODULE_NAME, result.insertedId, doc);

        resolve(RES.success('Succeed insert account_book '));
      } finally {
        resolve(RES.error('Insert failed'));
        // await client.close();
      }
    });
  }
}

module.exports = ClassName;
