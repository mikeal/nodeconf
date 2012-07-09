require('http').createServer(function (req, resp) {
  resp.statusCode = 301
  resp.setHeader('location', 'http://www.'+req.headers.host+req.url)
  resp.end()
}).listen(80)

