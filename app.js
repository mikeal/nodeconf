 var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = { _id:'_design/app'
  , rewrites : [
        {from:"/", to:'index.html'}
      , {from:"/api", to: '../../'}
      , {from:"/api/*", to: '../../*'}
      , {from:"/*", to:'*'}
      
    ]
  }
  
ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {     
    throw "Only admin can delete documents on this database."   
  } 
}

ddoc.views = {}
ddoc.views.proposalsByTimestamp = {}
ddoc.views.proposalsByTimestamp.map = function (doc) {
  if (doc.type === 'proposal' && doc.created) emit(doc.created, 1);
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'))

module.exports = ddoc