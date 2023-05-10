const MODULE_NAME = 'income'
const FILE_DIR = 'api/' + MODULE_NAME + '.js'
const { call, RES } = require('./class/utils')
const ClassModel = require('./class/' + MODULE_NAME)
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']
  console.log(MODULE_NAME + ' request', request.body.info)
  switch (Info) {
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
    default: {
      response.end(JSON.stringify(RES.error(`${FILE_DIR} : ${Info}  err`)))
    }
  }
}

module.exports = OnRequest
