// const { call, RES, client, ObjectId, moment } = require('./api/class/utils')
// const DATABASE = client.db('hdm189315162_db')
// const DIR = 'C:/Users/admin/Desktop/备份/aa_ledget/'

// const MODULE_NAME = 'aa_pay_budget'
// const COLLECTION = DATABASE.collection(MODULE_NAME)
// ;(async () => {
//   const deleteManyRes = await COLLECTION.deleteMany({ _pmonth: new Date('2023-05') }, {})
//   console.log(MODULE_NAME + ' deleteManyRes', deleteManyRes)
// })()

// const ClassModel = require('./api/class/payBudget')
// const ClassObj = new ClassModel()
// const response = {
//   end: (d) => {
//     console.log(d)
//   },
//   send: (d) => {
//     console.log(d)
//   }
// }

// call(ClassObj.copy('2023-05'), response)

// const MODULE_NAME = 'accountBook';
// const FILE_DIR = 'api/' + MODULE_NAME + '.js';
const moment = require('moment');
moment.locale('zh-cn');
// const ClassModel = require('./api/class/' + MODULE_NAME);
// const ClassObj = new ClassModel();

// call(ClassObj.insert(POST.tid, POST.n, POST.m, POST.d), response)

function t(sid_, aname_, amoney, aday_) {
  const doc = {
    sid: sid_,
    _sid: sid_,
    aname: aname_,
    amoney: Number(amoney),
    aday: aday_,
    _aday: new Date(aday_),
    atime: moment().format('YYYY-MM-DD HH:mm:SS'),
    _atime: new Date(),
    cid: 0,
  };

  console.log(doc);
}
t('1', 'eat', '1063', '2023-08-23');
