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
      , ogv: 'http://tenconf.s3.amazonaws.com/Node/Rick_Robot.ogv'
      , poster: 'http://tenconf.s3.amazonaws.com/Node/rick_waldron.png'
      }
  , ryan_dahl:
    { name: "Ryan Dahl"
    , meta: ["nodejs", "origins"]
    , m4v: 'http://tenconf.s3.amazonaws.com/Node/Ryan_Dahl.m4v'
    , ogv: 'http://tenconf.s3.amazonaws.com/Node/Ryan_Dahl.ogv'
    , poster: 'http://tenconf.s3.amazonaws.com/Node/ryan_dahl.png'
    }
  }

var render = handlebars.compile(template)
  , renderSpeaker = handlebars.compile('<a href="/theatre/{{key}}.html">{{name}}</a><br>')
  , speakers = ''
  ;

for (i in videos) {
  videos[i].shortname = i
  fs.writeFileSync(path.join(__dirname, 'theatre', i+'.html'), render(videos[i]))
  speakers += renderSpeaker({key:i, name:videos[i].name})
}

var indexTemplate = fs.readFileSync(path.join(__dirname, 'index.mustache')).toString()
  , renderIndex = handlebars.compile(indexTemplate)
  ;

fs.writeFileSync(path.join(__dirname, 'index.html'), renderIndex({speakers:speakers}))
