require('http').createServer(function (req, resp) {
  resp.statusCode = 301
  resp.setHeader('location', 'http://www.nodeconf.com'+req.url)
  resp.end()
}).listen(80)

