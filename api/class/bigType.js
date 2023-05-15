const MODULE_NAME = 'aa_big_type';
const { RES, client, ObjectId, moment } = require('./utils');
class Clasbname {
  constructor(TOKEN_USER_INFO) {
    this.DATABASE = client().db('hdm189315162_db');
    this.COLLECTION = this.DATABASE.collection(MODULE_NAME);
  }
  updatePXList(o) {
    return new Promise(async (resolve, reject) => {
      try {
        const ids = Object.keys(o);
        const len = ids.length;
        for (let i = 0; i < len; i++) {
          const id_ = ids[i];
          const px_ = o[id_];

          const whereStr = { _id: new ObjectId(id_) };
          const updateStr = {
            $set: {
              bpx: Number(px_),
            },
          };
          await this.COLLECTION.updateOne(whereStr, updateStr);
        }

        resolve(RES.success(MODULE_NAME + ' Succeed show '));
      } finally {
        resolve(RES.error(MODULE_NAME + ' show failed'));
        // await client.close();
      }
    });
  }
  show(id_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            bshow: 1,
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);

        resolve(RES.success(MODULE_NAME + ' Succeed show '));
      } finally {
        resolve(RES.error(MODULE_NAME + ' show failed'));
        // await client.close();
      }
    });
  }
  hide(id_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            bshow: 0,
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);

        resolve(RES.success(MODULE_NAME + ' Succeed hide '));
      } finally {
        resolve(RES.error(MODULE_NAME + ' hide failed'));
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

        resolve(RES.success(MODULE_NAME + 'Succeed DELETE'));
      } finally {
        resolve(RES.error(MODULE_NAME + 'DELETE failed'));
        // await client.close();
      }
    });
  }
  insert(bname_, btype_) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = {
          bname: bname_,
          btype: Number(btype_),
          bshow: 1,
          bpx: 0,
        };
        const result = await this.COLLECTION.insertOne(doc);
        console.log('result');
        console.log(result);

        resolve(RES.success(MODULE_NAME + ' Succeed insert'));
      } finally {
        resolve(RES.error(MODULE_NAME + ' Insert failed'));
        // await client.close();
      }
    });
  }
  updateName(id_, bname_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            bname: bname_,
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);

        resolve(RES.success(MODULE_NAME + ' Succeed updateName '));
      } finally {
        resolve(RES.error(MODULE_NAME + ' updateName failed'));
        // await client.close();
      }
    });
  }
  updatePX(id_, bpx_) {
    return new Promise(async (resolve, reject) => {
      try {
        const whereStr = { _id: new ObjectId(id_) };
        const updateStr = {
          $set: {
            bpx: Number(bpx_),
          },
        };
        const result = await this.COLLECTION.updateOne(whereStr, updateStr);
        console.log('result');
        console.log(result);

        resolve(RES.success(MODULE_NAME + ' Succeed updatePX '));
      } finally {
        resolve(RES.error(MODULE_NAME + ' updatePX failed'));
        // await client.close();
      }
    });
  }
  select(btype_ = 2, bshow_ = 1) {
    return new Promise(async (resolve, reject) => {
      // SELECT
      // s.id,s.bid,b.btype as t,s.bname as n,b.bname as bn,s.bshow as s,s.bpx as i
      // From `aa_small_type` s
      //  LEFT JOIN `aa_big_type` b
      //  ON s.bid=b.id
      //   WHERE s.bshow = 1 AND b.btype = '$btype_'
      //   ORDER BY s.bpx desc

      try {
        let conditions = {
          btype: Number(btype_),
        };
        if (bshow_ !== false) {
          conditions['bshow'] = Number(bshow_);
        }

        const options = {
          projection: {
            _id: 0,
            id: '$_id',
            n: '$bname',
            bn: '$bname',
            s: '$bshow',
            i: '$bpx',
          },
        };
        const list = await this.COLLECTION.find(conditions, options).sort({ bpx: -1 }).toArray();
        console.log(list);

        resolve(RES.success(list));
      } finally {
        resolve(RES.error([]));
        // await client.close();
      }
    });
  }
  selectAll(btype_ = 2) {
    return this.select(btype_, false);
  }
}

module.exports = Clasbname;
