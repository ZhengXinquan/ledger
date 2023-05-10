const { call, RES, client, ObjectId, moment } = require('./api/class/utils')
const DATABASE = client.db('hdm189315162_db')
const DIR = 'C:/Users/admin/Desktop/备份/aa_ledget/'

const MODULE_NAME = 'aa_pay_budget'
const COLLECTION = DATABASE.collection(MODULE_NAME)
;(async () => {
  const deleteManyRes = await COLLECTION.deleteMany({ _pmonth: new Date('2023-05') }, {})
  console.log(MODULE_NAME + ' deleteManyRes', deleteManyRes)
})()

const ClassModel = require('./api/class/payBudget')
const ClassObj = new ClassModel()
const response = {
  end: (d) => {
    console.log(d)
  },
  send: (d) => {
    console.log(d)
  }
}

call(ClassObj.copy('2023-05'), response)
