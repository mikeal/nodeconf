var request = function (options, callback) {
  options.success = function (obj) {
    callback(null, obj);
  }
  options.error = function (err) {
    if (err) callback(err);
    else callback(true);
  }
  if (options.data && typeof options.data == 'object') {
    options.data = JSON.stringify(options.data)
  }
  if (!options.dataType) options.processData = false;
  if (!options.dataType) options.contentType = 'application/json';
  if (!options.dataType) options.dataType = 'json';
  $.ajax(options)
}

$.expr[":"].exactly = function(obj, index, meta, stack){ 
  return ($(obj).text() == meta[3])
}

var param = function( a ) {
  // Query param builder from jQuery, had to copy out to remove conversion of spaces to +
  // This is important when converting datastructures to querystrings to send to CouchDB.
	var s = [];
	if ( jQuery.isArray(a) || a.jquery ) {
		jQuery.each( a, function() { add( this.name, this.value ); });		
	} else { 
	  for ( var prefix in a ) { buildParams( prefix, a[prefix] ); }
	}
  return s.join("&");
	function buildParams( prefix, obj ) {
		if ( jQuery.isArray(obj) ) {
			jQuery.each( obj, function( i, v ) {
				if (  /\[\]$/.test( prefix ) ) { add( prefix, v );
				} else { buildParams( prefix + "[" + ( typeof v === "object" || jQuery.isArray(v) ? i : "") +"]", v )}
			});				
		} else if (  obj != null && typeof obj === "object" ) {
			jQuery.each( obj, function( k, v ) { buildParams( prefix + "[" + k + "]", v ); });				
		} else { add( prefix, obj ); }
	}
	function add( key, value ) {
		value = jQuery.isFunction(value) ? value() : value;
		s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
	}
}

var proposals = 
  '<div id="proposal-info">' +
    '<h3>Call for Proposals.</h3>' +
    "<p>All submissions are public.</p>" +
    "<p>Your description field is raw html. You can stick any kind of styling or javascript you want in it. Don't get too cute though, we do triage this code to make sure it doesn't affect other proposals or the user's browser and we'll remove any that do.</p>" +
  '</div>' +
  '<div id="proposals">' +
    '<div id="proposal-editor">' +
      '<div id="speaker-github">GitHub Username</div>' +
      '<input id="speaker-github-input"></input>' +
      
      '<div id="speaker-twitter">Twitter</div>' +
      '<input id="speaker-twitter-input"></input>' +
      
      '<div id="speaker-location">City & Country</div>' +
      '<input id="speaker-location-input"></input>' +
      
      '<div id="speaker-name">Full Name</div>' +
      '<input id="speaker-name-input"></input><br>' +
      
      '<div id="speaker-email">Email</div>' +
      '<input id="speaker-email-input"></input><br>' +
      
      '<div id="proposal-title">Talk Title</div>' +
      '<input id="proposal-title-input"></input><br>' +
      
      '<div id="proposal-description">Talk  Description</div>' +
      '<textarea id="proposal-description"></textarea><br>' +
      
      '<div class="license">' +
        '<input type="checkbox" class="license"></input>' +
        'I hereby grant permission to record, publish, and release under <a href="http://creativecommons.org/licenses/by-sa/3.0/">Creative Commons license</a> the audio and video recording of my presentation.' +
      '</div>' +
      '<div class="spacer"></div>' +
      
      '<div id="proposal-notes">Additional Notes (not included in programme)</div>' +
      '<textarea id="proposal-notes"></textarea><br>' +

    '</div>' +
    '<div id="proposal-preview">' +
      '<div class="speaker-">' +
        '<div class="proposal-name"></div><div class="proposal-avatar"></div>' +
      '</div>' +
      '<div class="spacer"></div>' +
    
      '<div class="speaker-github-info">' +
        '<div class="speaker-github-picture"></div>' +
        '<div class="speaker-github-url"></div><br>' +
        '<div class="spacer"></div>' +
        '<div class="speaker-github-followcount"></div>' +
        '<div class="speaker-github-repos"></div>' +
        '<div class="spacer"></div>' +
      '</div>' +
    
      '<div class="speaker-twitter-info">' +
        '<div class="speaker-twitter-picture"></div>' +
        '<div class="speaker-twitter-name"></div>' +
        '<div class="speaker-twitter-followcount"></div>' +
        '<div class="spacer"></div>' +
        '<div class="speaker-twitter-description"></div>' +
      '</div>' +
      '<div class="spacer"></div>' +
      '<div id="location-map" class="location-map"></div>' +
      '<div class="spacer"></div>' +
      
      '<div class="proposal-short"></div>' +
      '<div class="proposal-desc"></div>' +
      
      '<div class="submit">' +
        '<div id="submit-container"></div>' +
        '<div id="submit-error"></div>' +
      '</div>' +
    '</div>' +
  '</div>'

var app = {};
app.index = function () {
  // Change formatting
  $('div#logo-image').css('width','100%').addClass('logo').removeClass('logo-on-page');
  $('div#info').removeClass('info-on-page');
  $('div#main').html('')
};

var shrinkHeader = function () {
  $('div#logo').removeClass('logo').addClass('logo-on-page');
  $('img.logo-image').css('width', "400px")
  $('div#info').addClass('info-on-page');
  $('img#logo-image').addClass('logo-on-page');
}

app.proposal = function () {
  var twitterObj
    , githubObj
    ;
  window.initializeGoogle = function () {}
  $.getScript('http://maps.google.com/maps/api/js?v=3.1&sensor=false&callback=initializeGoogle');
  
  // Change formatting
  shrinkHeader();
  
  // Add proposal box
  $('div#main').html(proposals);
  $('input#speaker-github-input').focus();
  
  var checkinputs = function () {
    var inputSelectors = 
      [ ['input#speaker-location-input', 'location']
      , ['input#speaker-name-input', 'full name']
      , ['input#speaker-email-input', 'email']
      , ['input#proposal-title-input', 'talk title']
      , ['textarea#proposal-description', 'talk description']
      // , ['input#speaker-twitter-input', 'twitter']
      // , ['input#speaker-github-input', 'github']
      ]
      ;
    var errors = [];
    for (var i=0;i<inputSelectors.length;i++) {
      if ($(inputSelectors[i][0]).val() === '') {
        errors.push(inputSelectors[i][1])
      }
    }
    if (!$('input.license').attr('checked')) errors.push('agreement')
    return errors;
  }
  
  // Preview update handlers
  var updateName = function () {
    $('div.proposal-name').text($('input#speaker-name-input').val())
    $('div.proposal-avatar').html(
      '<img class="proposal-avatar" src="'+'http://www.gravatar.com/avatar/'+
      hex_md5($('input#speaker-email-input').val())+'?s=75'+'"></img>'
    );
  }
  $('input#speaker-name-input').keyup(updateName);
  $('input#speaker-email-input').change(updateName);
  
  $('input#proposal-title-input').keyup(function () {
    $('div.proposal-short').text($(this).val())
  })
  $('textarea#proposal-description').keyup(function () {
    $('div.proposal-desc').html($(this).val())
    if ($('span#submit-button').length === 0) {
      $('<span id="submit-button" class="submit-button">Submit</span>')
      .click(function () {
        var errors = checkinputs();
        if (errors.length > 0) return alert('required fields are empty: '+errors.join(', '));
        
        var submission = 
          { twitter: twitterObj || $('input#speaker-twitter-input').val()
          , github:  githubObj  || $('input#speaker-github-input').val()
          , location: $('input#speaker-location-input').val()
          , name: $('input#speaker-name-input').val()
          , email: $('input#speaker-email-input').val()
          , title: $('input#proposal-title-input').val()
          , description: $('textarea#proposal-description').val()
          , notes: $('textarea#proposal-notes').val()
          , created: new Date()
          , type: 'proposal'
          }
        request({url:'/api', type:'POST', data:submission}, function (err, resp) {
          if (err) throw err;
          if (!resp.id) throw resp.id;
          window.location.hash = '#/proposal/'+resp.id;
        })
      })
      .hover(function () {
        var errors = checkinputs();
        if (errors.length > 0) $('div#submit-error').text('required fields are empty: '+errors.join(', '))
        else $('span#submit-button').addClass('submit-hover');
      }, function () {
        $('span#submit-button').removeClass('submit-hover');
        $('div#submit-error').text('')
      })
      .appendTo('div#submit-container')
      ;
    }
    
    
  })
  
  $('input#speaker-twitter-input').keyup(function () {
    var t = $(this).val()
      , self = this
      ;
    if (t[0] !== '@') {
      t = '@'+t;
      $(this).val(t);
    }
    setTimeout(function () {
      if (t !== $(self).val()) return;
      t = t.replace('@','')
      if (t.length === 0) return;
      if ($(self).val() === $('div.speaker-twitter-name').find('a').text()) return;
      request({url:'http://twitter.com/users/show/'+t+'.json?count=10', dataType:'jsonp'}, 
        function (err, resp) {
          if ('@'+t !== $(self).val()) return;
          if (resp.name) {
            $('div.speaker-twitter-name').html('<a href="http://twitter.com/'+t+'">@'+t+'</a>')
            if ($('input#speaker-name-input').val().length === 0 ) {
              $('input#speaker-name-input').val(resp.name).change();
            }
          }
          if (resp.profile_image_url) {
            $('div.speaker-twitter-picture').html(
              '<img class="twitter-picture" src="'+resp.profile_image_url+'" width="40"></img>'
            )
          }
          if (resp.description) $('div.speaker-twitter-description').text(resp.description);
          if (resp.location && $('input#speaker-location-input').val().length === 0) {
            $('input#speaker-location-input').val(resp.location).change();
          } 
          if (resp.followers_count) $('div.speaker-twitter-followcount').text(resp.followers_count+' followers')
          twitterObj = resp;
      })
    }, 200)
  })
  
  $('input#speaker-location-input').change(function () {
    var self = this;
    if (window.google.maps.Map) {
      var address = $(self).val();
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {            
          var map = new google.maps.Map(document.getElementById("location-map"), 
            { zoom: 12
            , center: results[0].geometry.location
            , mapTypeId: google.maps.MapTypeId.ROADMAP
            , disableDefaultUI: true
            , scrollwheel: false
            }
          );
          var marker = new google.maps.Marker({
              map: map, 
              position: results[0].geometry.location
          });
        } else {
          console.log("Geocode was not successful for the following reason: " + status);
        }
      });
    }
  })
  
  $('input#speaker-github-input').keyup(function () {
    var t = $(this).val()
      , self = this
      ;
    setTimeout(function () {
      if (t !== $(self).val()) return;
      if (t.length === 0) return;
      if ('github.com/'+$(self).val() === $('div.speaker-github-url').find('a').text()) return;
      request({url:'http://github.com/api/v2/json/user/show/'+t, dataType:'jsonp'}, function (err, resp) {
        if (t !== $(self).val() || !resp.user) return;
        $('div.speaker-github-url').html('<a href="http://github.com/'+t+'">github.com/'+t+'</a>')
        if (resp.user.name) {
          $('input#speaker-name-input').val(resp.user.name).change();
        }
        
        if (resp.user.gravatar_id) {
          $('div.speaker-github-picture').html(
            '<img class="github-picture" src="http://www.gravatar.com/avatar/'+resp.user.gravatar_id+'" width="40"></img>'
          )
        }
        if (resp.user.location) {
          $('input#speaker-location-input').val(resp.user.location).change();
        } 
        if (resp.user.followers_count) {
          $('div.speaker-github-followcount').text(resp.user.followers_count+' followers')
        } 
        if (resp.user.public_repo_count) {
          $('div.speaker-github-repos').text(resp.user.public_repo_count+' repos')
        }
        
        if (resp.user.email) {
          $('input#speaker-email-input').val(resp.user.email).change();
        }
        githubObj = resp;
      })
    }, 200);
  })
}


  
app.showProposal = function () {
  shrinkHeader();
  $('div#main').html('');
  request({url:'/api/'+this.params.id}, function (err, resp) {
    var twitter = resp.twitter
      , github = resp.github.user
      ;
    
    $('div#main').html(
      '<div class="talk">' +
        '<div class="talk-header">' +
          '<div class="talk-title">' + resp.title + '</div>' +
          '<div class="talk-speaker">' +
            '<img width=30 src="http://www.gravatar.com/avatar/' + hex_md5(resp.email) + '"></img>' +
            '<span class="talk-speaker-name">' + resp.name + '</span>' +
          '</div>' +
          '<div class="spacer"></div>' +
        '</div>' +
        '<div class="talk-description">' +
          '<blockquote class="talk-escaped-desc"></blockquote>' +
        '</div>' +
        '<div class="render-container">' +
          '<span class="render-button submit-button">render</span>' +
        '</div>' +
        '<div>Notes:</div>' +
        '<div class="talk-notes">' + resp.notes + '</div>' +
        '<div class="talk-speaker-info">' +
          '<div class="talk-speaker-twitter">' +
            '<div class="speaker-twitter-picture">' +
              '<img class="twitter-picture" src="' + twitter.profile_image_url + '" width="40"></img>' +
            '</div>' +
            '<div class="speaker-twitter-name">' + 
              '<a href="http://twitter.com/' + twitter.screen_name + '">@' + 
                twitter.screen_name + 
              '</a>' +
            '</div>' +
            '<div class="speaker-twitter-followcount">'+twitter.followers_count+' followers</div>' +
            '<div class="spacer"></div>' +
            '<div class="speaker-twitter-description">'+twitter.description+'</div>' +
          '</div>' +
          '<div class="talk-speaker-github">' +
            '<div class="speaker-github-picture">' +
              '<img class="github-picture" src="http://www.gravatar.com/avatar/'+github.gravatar_id+'" width="40"></img>' +
            '</div>' +
            '<div class="speaker-github-url">' + 
              '<a href="http://github.com/'+github.login+'">github.com/'+github.login+'</a>' +
            '</div><br>' +
            '<div class="spacer"></div>' +
            '<div class="speaker-github-followcount">'+github.followers_count+' followers</div>' +
            '<div class="speaker-github-repos">'+github.public_repo_count+' repos</div>' +
            '<div class="spacer"></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    )
    $('blockquote.talk-escaped-desc').text(resp.description);
    $('span.render-button')
    .hover(function () {
      $('span.submit-button').addClass('submit-hover');
    }, function () {
      $('span.submit-button').removeClass('submit-hover');
    })
    .click(function () {
      $('div.talk-description').html($('blockquote.talk-escaped-desc').text())
      $(this).remove();
    })
  })
  
}

$(function () { 
  app.s = $.sammy(function () {
    // Call for proposals
    this.get("#/proposal/:id", app.showProposal);
    this.get("#/proposal", app.proposal);
    
    // Index of all databases
    this.get('', app.index);
    this.get("#/", app.index);
  })
  app.s.run();
});
