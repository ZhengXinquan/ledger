const { RES, client, ObjectId, moment } = require('./utils');
class ClassName {
  constructor(TOKEN_USER_INFO) {
    this.DATABASE = client().db('hdm189315162_db');
    this.COLLECTION = this.DATABASE.collection('aa_pay_budget');
  }
  copy(month_) {
    return new Promise(async (resolve, reject) => {
      const fullTime = month_ + '-01';
      const lastMonth = moment(fullTime).subtract(1, 'months').format('YYYY-MM-DD');
      try {
        let conditions = {
          _pmonth: new Date(lastMonth),
        };
        const options = {
          projection: {
            _id: 1,
            id: '$_id',
            sid: 1,
            _sid: 1,
            pmoney: 1,
          },
        };
        const list = await this.COLLECTION.find(conditions, options).toArray();
        console.log(list);

        const _pmonth = new Date(month_);
        const result = await this.COLLECTION.insertMany(
          list.map(e => ({
            sid: e.sid,
            pmoney: e.pmoney,
            pmonth: fullTime,
            _sid: new ObjectId(e._sid),
            _pmonth: _pmonth,
          })),
        );
        console.log('result');
        console.log(result);

        resolve(RES.success('Succeed insert account_book '));
      } finally {
        resolve(RES.error([]));
        // await client.close();
      }
    });
  }
  select(month_) {
    return new Promise(async (resolve, reject) => {
      const fullTime = month_ + '-01';
      try {
        let conditions = {
          _pmonth: new Date(month_),
        };
        let list = await this.COLLECTION.aggregate([
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
          // { $unwind: '$smallTypes' },
          {
            $addFields: {
              _bid: { $first: '$smallTypes._bid' },
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
          {
            $lookup: {
              // localField: 'yearMonth', // 左集合 join 字段
              from: 'aa_account_book', // 右集合

              let: {
                pb_sid: '$_sid',
              },
              pipeline: [
                // {
                //   $addFields: {
                //     _aday: {
                //       $dateFromString: {
                //         dateString: '$aday'
                //       }
                //     }
                //   }
                // },
                {
                  $addFields: {
                    yearMonth: {
                      $dateToString: {
                        format: '%Y-%m',
                        date: '$_aday',
                        timezone: '+0800',
                      },
                    },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$yearMonth', month_] }, { $eq: ['$_sid', '$$pb_sid'] }],
                    },
                  },
                },

                {
                  $group: {
                    _id: '$_sid',
                    summoney: { $sum: '$amoney' },
                    aid: { $first: '$_id' },
                    sid: { $first: '$_sid' },
                  },
                },
              ],
              // foreignField: 'yearMonth', // 右集合 join 字段
              as: 'accounts', // 新生成字段（类型array）
            },
          },
          {
            $project: {
              _id: 0,
              id: '$_id',
              sid: '$_sid',
              bid: '$_bid',

              m: '$pmoney',
              d: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$_pmonth',
                  timezone: '+0800',
                },
              },

              sn: { $first: '$smallTypes.sname' },
              bn: { $first: '$bigTypes.bname' },

              pm: { $first: '$accounts.summoney' },
            },
          },
          {
            $sort: {
              m: -1,
              ptime: -1,
            },
          },
        ]).toArray();

        list = list.map(e => {
          return {
            ...e,

            pm: e.pm || 0,
            lm: (e.m || 0) - (e.pm || 0),
          };
        });

        resolve(RES.success(list));
      } finally {
        resolve(RES.error([]));
        // await client.close();
      }
    });
  }

  delete(ids_) {
    return new Promise(async (resolve, reject) => {
      try {
        const ids = ids_.split(',').map(id => new ObjectId(id));

        let conditions = {
          _id: { $in: ids },
        };

        const result = await this.COLLECTION.deleteMany(conditions);
        console.log(result, conditions);

        resolve(RES.success('Succeed DELETE pay_budget'));
      } finally {
        resolve(RES.error('DELETE failed'));
        // await client.close();
      }
    });
  }

  insert(sid_, pmoney_, pmonth_) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = {
          sid: sid_,
          _sid: new ObjectId(sid_),
          _pmonth: new Date(pmonth_),
          _ptime: new Date(),
          pmonth: pmonth_,
          pmoney: Number(pmoney_),
          ptime: moment().format('yyyy-MM-DD HH:mm:SS'),
          cid: 0,
        };
        const result = await this.COLLECTION.insertOne(doc);
        console.log('result');
        console.log(result);

        resolve(RES.success('Succeed insert budget '));
      } finally {
        resolve(RES.error('Insert failed'));
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

        resolve(RES.success('Succeed updateType budget '));
      } finally {
        resolve(RES.error('updateType failed'));
        // await client.close();
      }
    });
  }
  updateDetail(id_, pmoney_, pmonth_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            pmoney: Number(pmoney_),
            pmonth: pmonth_,
            _pmonth: new Date(pmonth_),
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);

        resolve(RES.success('Succeed updateDetail budget '));
      } finally {
        resolve(RES.error('updateDetail failed'));
        // await client.close();
      }
    });
  }
}

module.exports = ClassName;
