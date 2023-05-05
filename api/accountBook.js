const FILE_DIR = 'api/accountbook.js'
const ClassModel = require('./class/accountBook')
const ClassObj = new ClassModel()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']

  console.log('Account Book request', request.body.info)

  switch (Info) {
    case 'selectPayDetailByTime':
      {
        const $time_ = POST.d
        const $type_ = POST.t
        ClassObj.selectPayDetailByTime($time_, $type_)
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
        ClassObj.insert(POST.tid, POST.n, POST.m, POST.d)
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
        if (POST.month) {
          ClassObj.select(POST.month)
            .then((res) => {
              response.end(JSON.stringify(res))
            })
            .catch((err) => {
              console.log(err)
              response.send(FILE_DIR + 'err')
              response.end()
            })
        } else {
          response.end({ tip: 0, d: [], msg: 'arg err' })
        }
      }
      break
    default:
  }
}

module.exports = OnRequest
