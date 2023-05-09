const { RES, client, ObjectId, moment } = require('./api/class/utils')
const DATABASE = client.db('hdm189315162_db')
const DIR = 'C:/Users/admin/Desktop/备份/aa_ledget/'
const fs = require('fs')

async function init(MODULE_NAME, setData) {
  const DATA = require(DIR + MODULE_NAME + '.json')
  console.log(MODULE_NAME + '.json', DATA.RECORDS)
  COLLECTION = DATABASE.collection(MODULE_NAME)

  const list = await COLLECTION.find({}, {}).toArray()
  console.log(MODULE_NAME + ' old list', list.length)

  const deleteManyRes = await COLLECTION.deleteMany({}, {})
  console.log(MODULE_NAME + ' deleteManyRes', deleteManyRes)

  const newData = (DATA.RECORDS || DATA).map((e) => setData(e))

  console.log(MODULE_NAME + ' newData', newData)

  const insertRes = await COLLECTION.insertMany(newData)

  console.log(MODULE_NAME + ' insertRes', insertRes)

  const newRes = await COLLECTION.findOne({}, {})
  console.log(MODULE_NAME + ' newRes', newRes)
}

;(async () => {
  await init('aa_big_type', (e) => {
    return {
      ...e,
      _id: new ObjectId(e.id)
    }
  })

  const bigTypes = await DATABASE.collection('aa_big_type').find({}, {}).toArray()
  await init('aa_small_type', (e) => {
    const bigType = bigTypes.find((b) => b.id == e.bid)
    return {
      ...e,
      _id: new ObjectId(e.id),
      bid: bigType.id,
      _bid: new ObjectId(bigType._id)
    }
  })
  await init('aa_income', (e) => {
    const bigType = bigTypes.find((b) => b.id == e.bid)
    return {
      ...e,
      _id: new ObjectId(e.id),
      bid: bigType.id,
      _bid: new ObjectId(bigType._id),
      _iday: new Date(e.iday),
      _itime: new Date(e.itime)
    }
  })

  const smallTypes = await DATABASE.collection('aa_small_type').find({}, {}).toArray()
  await init('aa_pay_budget', (e) => {
    const smallType = smallTypes.find((b) => b.id == e.sid)
    return {
      ...e,
      _id: new ObjectId(e.id),
      sid: smallType.id,
      _sid: new ObjectId(smallType._id),
      _pmonth: new Date(e.pmonth),
      _ptime: new Date(e.ptime)
    }
  })
  await init('aa_account_book', (e) => {
    const smallType = smallTypes.find((b) => b.id == e.sid)
    return {
      ...e,
      _id: new ObjectId(e.id),
      sid: smallType.id,
      _sid: new ObjectId(smallType._id),
      _aday: new Date(e.aday),
      _atime: new Date(e.atime)
    }
  })
})()
