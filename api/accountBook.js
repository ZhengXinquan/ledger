const MODULE_NAME = 'accountBook'
const FILE_DIR = 'api/' + MODULE_NAME + '.js'
const { call, RES } = require('./class/utils')
const ClassModel = require('./class/' + MODULE_NAME)
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']
  console.log(MODULE_NAME + ' request', request.body.info)
  switch (Info) {
    case 'selectBillByYear':
      call(ClassObj.selectBillByYear(POST.year), response)
      break
    case 'selectPayDetailByTime':
      call(ClassObj.selectPayDetailByTime(POST.d, POST.t), response)
      break
    case 'selectPayDetailBySidAndTime':
      call(ClassObj.selectPayDetailBySidAndTime(POST.id, POST.d, POST.t), response)
      break
    case 'select_by_month':
      call(ClassObj.select(POST.month), response)
      break
    case 'search':
      call(ClassObj.search(POST.st, POST.et, POST.n, POST.bn, POST.sn), response)
      break
    case 'delete':
      call(ClassObj.delete(POST.id), response)
      break
    case 'insert':
      call(ClassObj.insert(POST.tid, POST.n, POST.m, POST.d), response)
      break

    case 'update_type':
      call(ClassObj.updateType(POST.id, POST.tid), response)
      break

    case 'update_detail':
      call(ClassObj.updateDetail(POST.id, POST.n, POST.m, POST.d), response)
      break
    default:
      response.end(JSON.stringify(RES.error(`${FILE_DIR} : ${Info}  err`)))
  }
}

module.exports = OnRequest
