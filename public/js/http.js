var http = function (url, postData, toLoading) {
  var DEFAULT_API = "/";
  return axios({
    url: DEFAULT_API + url,
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    transformRequest: [
      function (data) {
        // 对 data 进行任意转换处理
        toLoading();
        return Qs.stringify(data);
      },
    ],
    transformResponse: [
      function (data) {
        // 对 data 进行任意转换处理
        toLoading(false);
        return JSON.parse(data);
      },
    ],
    data: postData,
  });
};
