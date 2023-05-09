const FILE_DIR = 'api/bitType.js'
const ClassModel = require('./class/bigType')
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']

  console.log('AccountBook request', request.body.info)

  switch (Info) {
    case 'select_income':
      //   const $time_ = POST.d
      //   const $type_ = POST.t
      ClassObj.select(1)
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
