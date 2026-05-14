const MODULE_NAME = 'aa_income';
const { RES, client, ObjectId, moment } = require('./utils');
class Clasbname {
  constructor(TOKEN_USER_INFO) {
    this.DATABASE = client().db('hdm189315162_db');
    this.COLLECTION = this.DATABASE.collection(MODULE_NAME);
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
  delete(id_) {
    return new Promise(async (resolve, reject) => {
      try {
        let conditions = {
          _id: new ObjectId(id_),
        };
        const detail =  await this.COLLECTION.findOne(conditions);
        // const result = await this.COLLECTION.deleteOne(conditions);
        console.log(result, conditions);
        // this.log('delete ' + MODULE_NAME, new ObjectId(id_), result);
        this.log('try delete ' + MODULE_NAME, new ObjectId(id_), {result,detail});

        resolve(RES.success(MODULE_NAME + 'Succeed DELETE'));
      } finally {
        resolve(RES.error(MODULE_NAME + 'DELETE failed'));
        // await client.close()
      }
    });
  }
  insert(bid_, iname_, imoney_, iday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = {
          bid: bid_,
          iname: iname_,
          imoney: Number(imoney_),
          iday: iday_,
          _bid: new ObjectId(bid_),
          _iday: new Date(iday_),
          _itime: new Date(),
        };
        const result = await this.COLLECTION.insertOne(doc);
        console.log('result');
        console.log(result);
        this.log('insert ' + MODULE_NAME, result.insertedId, doc);
        resolve(RES.success(MODULE_NAME + ' Succeed insert'));
      } finally {
        resolve(RES.error(MODULE_NAME + ' Insert failed'));
        // await client.close()
      }
    });
  }
  updateType(id_, bid_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            bid: bid_,
            _bid: new ObjectId(bid_),
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);
        this.log('updateType ' + MODULE_NAME, new ObjectId(id_), { _bid: new ObjectId(_bid) });

        resolve(RES.success(MODULE_NAME + ' Succeed updateType '));
      } finally {
        resolve(RES.error(MODULE_NAME + ' updateType failed'));
        // await client.close()
      }
    });
  }
  updateDetail(id_, iname_, imoney_, iday_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            iname: iname_,
            imoney: Number(imoney_),
            _iday: new Date(iday_),
            iday: iday_,
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);
        this.log('updateDetail ' + MODULE_NAME, new ObjectId(id_), {
          iname: iname_,
          imoney: Number(imoney_),
          _iday: new Date(iday_),
          iday: iday_,
        });

        resolve(RES.success(MODULE_NAME + ' Succeed updateDetail '));
      } finally {
        resolve(RES.error(MODULE_NAME + ' updateDetail failed'));
        // await client.close()
      }
    });
  }
}

module.exports = Clasbname;
