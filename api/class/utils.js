const moment = require('moment');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri =
  'mongodb+srv://zhengxinquan:hqmMkpDhJi9Zwfa8@blog-c.iy6i7qc.mongodb.net/?retryWrites=true&w=majority';
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = () => {
  return new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
};
class RES {
  constructor() {}
  success(data, message) {
    return {
      tip: 1,
      d: data,
      msg: message || 'default success',
    };
  }
  error(data, message) {
    let msg = 'default error';
    if (data.message) {
      msg = data.message;
    }
    if (message) {
      msg = message;
    }
    return {
      tip: 0,
      d: data,
      msg: msg,
    };
  }
}

function call(promise, response) {
  promise
    .then(res => {
      response.end(JSON.stringify(res));
    })
    .catch(err => {
      console.log(err);
      response.send(FILE_DIR + 'err');
      response.end();
    });
}

module.exports = { client, ObjectId, RES: new RES(), moment, call };
