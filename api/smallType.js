const FILE_DIR = 'api/smallType.js'
const ClassModel = require('./class/smallType')
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']

  console.log('AccountBook request', request.body.info)

  switch (Info) {
    case 'select_pay':
      //   const $time_ = POST.d
      //   const $type_ = POST.t
      ClassObj.select()
        .then((res) => {
          response.end(JSON.stringify(res))
        })
        .catch((err) => {
          console.log(err)
          response.send(FILE_DIR + 'err')
          response.end()
        })
      break

    default:
  }
}

module.exports = OnRequest
