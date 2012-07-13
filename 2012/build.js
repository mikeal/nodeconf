var handlebars = require('handlebars')
  , fs = require('fs')
  , path = require('path')
  ;

var template = fs.readFileSync(path.join(__dirname, 'template.mustache')).toString()

var videos =
  { rick_waldron: 
      { name: "Rick Waldron"
      , meta: ["robots", "nodejs"]
      , m4v: 'http://tenconf.s3.amazonaws.com/Node/Rick_Robot.m4v'
      , poster: 'http://tenconf.s3.amazonaws.com/Node/rick_waldron.png'
      }
  }

var render = handlebars.compile(template)

for (i in videos) {
  videos[i].shortname = i
  fs.writeFileSync(path.join(__dirname, 'theatre', i+'.html'), render(videos[i]))
}

