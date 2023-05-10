const MODULE_NAME = 'bigType'
const FILE_DIR = 'api/' + MODULE_NAME + '.js'
const { call, RES } = require('./class/utils')
const ClassModel = require('./class/' + MODULE_NAME)
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']
  console.log(MODULE_NAME + ' request', request.body.info)
  switch (Info) {
    case 'px':
      call(ClassObj.updatePXList(JSON.parse(POST.list)), response)
      break
    case 'show':
      call(ClassObj.show(POST.id), response)
      break
    case 'hide':
      call(ClassObj.hide(POST.id), response)
      break
    case 'delete':
      call(ClassObj.delete(POST.id), response)
      break
    case 'insert':
      call(ClassObj.insert(POST.n, POST.m), response)
      break

    case 'update_name':
      call(ClassObj.updateName(POST.id, POST.n), response)
      break

    case 'update_px':
      call(ClassObj.updatePX(POST.id, POST.p), response)
      break

    case 'select_income':
      call(ClassObj.select(1), response)
      break
    case 'select_pay':
      call(ClassObj.select(), response)
      break
    case 'select_all_income':
      call(ClassObj.selectAll(1), response)
      break
    case 'select_all_pay':
      call(ClassObj.selectAll(), response)
      break
    default: {
      response.end(JSON.stringify(RES.error(`${FILE_DIR} : ${Info}  err`)))
    }
  }
}

module.exports = OnRequest
