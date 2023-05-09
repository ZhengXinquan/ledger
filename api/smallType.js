const MODULE_NAME = 'smallType'
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
      const list = JSON.parse(POST.list)
      console.log(list)

      // foreach ($obj as $key=>$value)
      // {
      // 	$smallType -> updatePX($key,$value,0);
      // }
      // $json_data = array('tip' => 1, 'd' => 'success');
      // echo json_encode($json_data);
      response.send(FILE_DIR + 'err')
      response.end()
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
