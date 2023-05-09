const MODULE_NAME = 'payBudget'
const FILE_DIR = 'api/' + MODULE_NAME + '.js'
const { call, RES } = require('./class/utils')
const ClassModel = require('./class/' + MODULE_NAME)
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']
  console.log(MODULE_NAME + ' request', request.body.info)
  switch (Info) {
    case 'copy_by_month':
      call(ClassObj.copy(POST.month), response)
      break
    case 'select_by_month':
      call(ClassObj.select(POST.month), response)
      break
    case 'delete':
      call(ClassObj.delete(POST.ids), response)
      break

    case 'insert':
      call(ClassObj.insert(POST.tid, POST.m, POST.d + '-01'), response)
      break

    case 'update_type':
      call(ClassObj.updateType(POST.id, POST.tid), response)
      break

    case 'update_detail':
      call(ClassObj.updateDetail(POST.id, POST.m, POST.d), response)
      break
    default:
      response.end(JSON.stringify(RES.error(`${FILE_DIR} : ${Info}  err`)))
  }
}

module.exports = OnRequest
