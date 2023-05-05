const FILE_DIR = 'api/accountbook.js'
const AccountBook = require('./class/accountBook')
const ACCOUNT_BOOK = new AccountBook()

async function OnRequest(request, response) {
  const POST = request.body
  const Info = POST['info']

  console.log('AccountBook request', request.body.info)

  switch (Info) {
    case 'selectPayDetailByTime':
      const $time_ = POST.d
      const $type_ = POST.t
      ACCOUNT_BOOK.selectPayDetailByTime($time_, $type_)
        .then((res) => {
          response.end(JSON.stringify(res))
        })
        .catch((err) => {
          console.log(err)
          response.send(FILE_DIR + 'err')
          response.end()
        })
      break

    case 'select_by_month':
      if (POST.month) {
        ACCOUNT_BOOK.select(POST.month)
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

      break
    default:
  }
}

module.exports = OnRequest
