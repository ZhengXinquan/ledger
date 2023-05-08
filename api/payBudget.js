const FILE_DIR = 'api/payBudget.js'
const ClassModel = require('./class/payBudget')
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']

  console.log('Account Book request', request.body.info)

  switch (Info) {
    case 'copy_by_month':
      {
        ClassObj.copy(POST.month)
          .then((res) => {
            response.end(JSON.stringify(res))
          })
          .catch((err) => {
            console.log(err)
            response.send(FILE_DIR + 'err')
            response.end()
          })
      }
      break
    case 'select_by_month':
      {
        ClassObj.select(POST.month)
          .then((res) => {
            response.end(JSON.stringify(res))
          })
          .catch((err) => {
            console.log(err)
            response.send(FILE_DIR + 'err')
            response.end()
          })
      }
      break
    case 'delete':
      {
        ClassObj.delete(POST.ids)
          .then((res) => {
            response.end(JSON.stringify(res))
          })
          .catch((err) => {
            console.log(err)
            response.send(FILE_DIR + 'err')
            response.end()
          })
      }
      break

    case 'insert':
      {
        ClassObj.insert(POST.tid, POST.m, POST.d + '-01')
          .then((res) => {
            response.end(JSON.stringify(res))
          })
          .catch((err) => {
            console.log(err)
            response.send(FILE_DIR + 'err')
            response.end()
          })
      }
      break

    case 'update_type':
      {
        ClassObj.updateType(POST.id, POST.tid)
          .then((res) => {
            response.end(JSON.stringify(res))
          })
          .catch((err) => {
            console.log(err)
            response.send(FILE_DIR + 'err')
            response.end()
          })
      }
      break

    case 'update_detail':
      {
        ClassObj.updateDetail(POST.id, POST.m, POST.d)
          .then((res) => {
            response.end(JSON.stringify(res))
          })
          .catch((err) => {
            console.log(err)
            response.send(FILE_DIR + 'err')
            response.end()
          })
      }
      break
    default:
  }
}

module.exports = OnRequest
