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
  // $('div#logo-image').css('width','100%').addClass('logo').removeClass('logo-on-page');
  // $('div#info').removeClass('info-on-page');
  $('div#main').html('')
  $("span#call-for-proposals").click(function () {
      window.location = "/#/proposal"
  })
  $('div#content').show();
  $('div#main-section').hide();
  $('div#sps-biglogo').hide();
  $('div#main-speakers').show();
  $('div#info-section').show();
  
  $('span.talkhook').click(function () {
    var id = $(this).attr('id');
    $('div#info-section').hide();
    $('div#main-section').show().html('')
    request({url:'/api/'+id}, function (e, resp) {
      var u = '';
      if (resp.twitter && resp.twitter.url) u = resp.twitter.url;
      if (resp.github && resp.github.user.blog) u = resp.github.user.blog;
      if (u !== '' && u.slice(0, 'http'.length) !== 'http') u = ('http://'+u);
      $('div#main-section').html(
          '<h3><a href="'+u+'">'+resp.name+'</a></h3>'+
          '<h2 class="top-talk-title">'+resp.title+'</h2>'+
          '<div class="proposal-desc">' + resp.description + '</div>'
        )
    })
  })
};

var shrinkHeader = function () {
  $("div#content").hide()
  // $('div#logo').removeClass('logo').addClass('logo-on-page');
  // $('img.logo-image').css('width', "400px")
  // $('div#info').addClass('info-on-page');
  // $('img#logo-image').addClass('logo-on-page');
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
    var twitter = (resp.twitter) ? resp.twitter : {}
      , github = (resp.github && resp.github.user) ? resp.github.user : {}
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

app.showSponsor = function () {
  console.log("asdf")
  $('div#info-section').hide();
  $('div#main-speakers').hide();
  $('div#main-section')
    .show()
    .html(
      { yammer : '<p><a href="http://www.yammer.com">Yammer</a> (<a href="http://www.yammer.com">www.yammer.com</a>) is the leader in enterprise social networking, providing a secure way for employees to communicate, collaborate, and share information. The basic version of Yammer is free, and customers can pay to upgrade their network to receive additional administrative and security controls, priority customer service and a dedicated customer success manager. More than 100,000 companies and organizations are using our award-winning Software-as-a-Service (SaaS) solution to improve employee productivity and engagement.</p>'
      
      , andyet : '<p><a href="http://www.andyet.net">&yet</a> (<a href="http://www.andyet.net">www.andyet.net</a>) makes web software for human people (and have a nearly inappropriate amount of fun doing it). Their team includes established contributors to the web community in XMPP and realtime web technologies, cloud cartography, and Javascript.</p>'
      
      , 'basho': '<a href="http://www.basho.com">Basho Technologies</a> (<a href="http://www.basho.com">www.basho.com</a>), is the creator and commercial sponsor          of <a href="http://wiki.basho.com">Riak</a>, an open source, scalable, non-relational database being used in production by companies including Mozilla, Comcast, Wikia, and Mochi Media.</p> <p>Why is Basho sponsoring JSConf and NodeConf? Because we have an up-and-coming community of JavaScript users that sustain us with hard work, positivity, and code contributions, and we are committed to making their lives easier with a scalable, rock-solid, fault-tolerant database for production applications.</p> <p>Basho was founded in January 2008 by a core group of Software Architects, Engineers and Executive Leadership from Akamai Technologies and is headquartered in Cambridge, Massachusetts.</p>'
      , 'mozilla': '<p><a href="http://mozilla.org">Mozilla</a> (<a href="http://mozilla.org">http://mozilla.org</a>) is a global community dedicated to building free, open source products and technologies that improve the online experience for people everywhere. We work in the open with a highly disciplined, transparent and cooperative development process, under the umbrella of the non-profit Mozilla Foundation. As a wholly owned subsidiary, the Mozilla Corporation organizes the development and marketing of Mozilla products. This unique structure has enabled Mozilla to financially support and cultivate competitive, viable community innovation. For more information, visit</p>'
      , hpwebos: '<p>At <a href="http://developer.palm.com">Palm</a>, the web is at the foundation of everything we do. As the only mobile platform built on the web, Palm webOS offers developers a thriving environment for creating, distributing, and promoting applications. From an SDK based on web standards to a developer program that leverages the web to deliver openness and choice in distribution, we are making it easier than ever before to take your web skills to mobile. Of course, this is only the beginning. We believe the web is the future of mobile development, and we’re excited to be a part of the community that is driving this amazing transformation. For more information visit <a href="http://developer.palm.com">http://developer.palm.com/</a>.</p>'
      , facebook: '<p><a href="http://www.facebook.com/engineering">Facebook</a> is a social utility that helps over 500 million people around the world communicate more efficiently with their friends, family and coworkers. The site has been built on common open source software such as Linux, Apache, MySQL, and PHP and over the past few years, the company has developed a number of <a href="http://developers.facebook.com/opensource.php">open source infrastructure technologies</a> to support the site\'s growth including <a href="http://developers.facebook.com/hiphop-php/">HipHop for PHP</a>, <a href="http://incubator.apache.org/cassandra/">Cassandra</a>, <a href="http://wiki.apache.org/hadoop/Hive">Hive</a>, <a href="http://developers.facebook.com/scribe/">Scribe</a>, and <a href="http://incubator.apache.org/thrift/">Thrift</a>. Facebook engineers actively contribute and participate in various open source projects, developing technologies that facilitate the sharing of information through the social graph.</p>'
      , zappos: '<p>The <a href="http://www.zappos.com">Zappos</a> Family of Companies, a subsidiary of <a href="http://www.amazon.com">Amazon.com</a>, is a leader in online apparel and footwear sales by striving to provide shoppers the best possible service and selection. We carry millions of products from over 1000 footwear and apparel brands. Established in 1999, we are currently located in Las Vegas, NV, Shepherdsville, KY, and with a brand-spanking new extension software development shop, we\'re back in our "hometown," San Francisco, CA. There are approximately 2,500 Zapponians, but continual growth makes that number ever-increasing.</p><p>We\'ve been asked by a lot of people how we\'ve grown so quickly, and the answer is actually really simple...we\'ve aligned the entire organization around one mission: to provide the best customer service possible. Internally, we call this our WOW philosophy.</p><p>And, we believe that it’s our unique, “fun and a little weird” culture that drives the WOW. In January 2011, Zappos earned #6 on the 2010 Fortune: 100 Best Companies to Work For List, and our sales exceed 1 billion dollars a year. We think we might be on to something here...</p>'
      , voxer: '<p><a href="http://www.voxer.com">Voxer</a> is a Walkie Talkie application for smartphones. With Voxer, you can send instant voice messages to your friends. Messages are streamed live as you are talking, and your friends can join you live or listen later.  Voxer is currently available for iOS devices, and an Android version will be released later this year.</p><p>Voxer uses node.js for all of our backend systems.  Check it out and see what node sounds like.'
      , google: '<p><a href="http://www.google.com">Google</a>\'s innovative search technologies connect millions of people around the world with information every day. Founded in 1998 by Stanford Ph.D. students Larry Page and Sergey Brin, Google today is a top web property in all major global markets. Google\'s targeted advertising program provides businesses of all sizes with measurable results, while enhancing the overall web experience for users. Google is headquartered in Silicon Valley with offices throughout the Americas, Europe and Asia. For more information, visit www.google.com.</p>'
      , rackspace: '<p><a href="http://www.rackspace.com">Rackspace</a>(r) Hosting is the world\'s leading specialist in the hosting and cloud computing industry, and the founder of OpenStack(tm), an open source cloud platform. The San Antonio-based company provides Fanatical Support(r) to its customers, across a portfolio of IT services, including Managed Hosting and Cloud Computing. In 2010, Rackspace was recognized by Bloomberg BusinessWeek as a Top 100 Performing Technology Company and listed on the InformationWeek 500 as one of the nation\'s most innovative users of business technology. The company was also positioned in the Leaders Quadrant by Gartner Inc. in the "2010 Magic Quadrant for Cloud Infrastructure as a Service and Web Hosting." For more information, visit <a href="http://www.rackspace.com">www.rackspace.com</a>.</p>'
      , smugmug: '<p><a href="http://www.smugmug.com">SmugMug</a> sets the standard for online photo hosting and sharing. Whether you shoot photo or video, there’s room for it all with SmugMug’s totally unlimited uploads. Best of all, SmugMug never shrinks your photos to save space. Zip up and download your originals with a click, turning your beautiful photo galleries into safe backups.  With customizable privacy options, easy order fulfillment and control over your site\'s look and feel, you get tons of tools and features for as little as $5/month. Shoot, print and share with SmugMug.</p>'
      , bloomberg: '<p><a href="http://www.bloomberg.com">Bloomberg</a> is the world\'s most trusted source of information for businesses and professionals. Bloomberg combines innovative technology with unmatched analytic, data, news, display and distribution capabilities, to deliver critical information via the BLOOMBERG PROFESSIONAL® service and multimedia platforms. Bloomberg\'s media services cover the world with more than 2,200 news and multimedia professionals at 146 bureaus in 72 countries. The BLOOMBERG TELEVISION® 24-hour network delivers smart television to more than 240 million homes. 1worldspace™ satellite radio globally and on WBBR 1130AM in New York. The award-winning monthly BLOOMBERG MARKETS® magazine, Bloomberg BusinessWeek magazine and the BLOOMBERG.COM® financial news and information Web site provide news and insight to businesses and investors.</p>'
      , joyent: '<p>Joyent is a global cloud computing software and service provider that offers an integrated suite of cloud software and services to service providers and enterprises, and public cloud services to some of the most innovative companies in the world, such as LinkedIn, Gilt Groupe and Kabam. For more information, visit <a href="http://www.joyent.com">http://www.joyent.com</a> and <a href="http://www.joyentcloud.com">http://www.joyentcloud.com</a>.</p>'
      , nodejitsu: '<p>Nodejitsu is a Cloud Platform-as-a-Service and marketplace for node.js applications. Founded by early adopters of node.js, Nodejitsu is committed to furthering both the node.js community and open source software. For more information visit <a href="http://nodejitsu.com">http://nodejitsu.com</a></p>'
      }[this.params.name]
  )
  $('div#sps-biglogo')
    .show()
    .html(
      { yammer: '<img class="biglogo" src="/img/Yammer.png" />'
      , andyet: '<img class="biglogo" src="/img/andyet.png"/>'  
      , basho: '<img class="biglogo" src="/img/Basho.png"/>'  
      , mozilla: '<img class="biglogo" src="/img/mozilla.png"/>'  
      , facebook: '<img class="biglogo" src="/img/Facebook.png"/>'
      , hpwebos: '<img class="biglogo" src="/img/HPwebOS.png" />'
      , zappos: '<img class="biglogo" src="/img/ZapposFamily.png" />'
      , voxer: '<img class="biglogo" src="/img/Voxer.png" />'
      , google: '<img class="biglogo" src="/img/Google.png" />'
      , rackspace: '<img class="biglogo" src="/img/Rackspace.png" />'
      , smugmug: '<img class="biglogo" src="/img/SmugMug.png" />'
      , bloomberg: '<img class="biglogo" src="/img/bloomberg.png" />'
      , joyent: '<img class="biglogo" src="/img/joyent.png" />'
      , nodejitsu: '<img class="biglogo" src="/img/nodejitsu.png" />'
      }[this.params.name]
    )
}

$(function () { 
  app.s = $.sammy(function () {
    // Call for proposals
    this.get("#/proposal/:id", app.showProposal);
    this.get("#/proposal", app.proposal);
    
    this.get("#/sponsors/:name", app.showSponsor);
    
    // Index of all databases
    this.get('', app.index);
    this.get("#/", app.index);
  })
  $(function () {
    // setup sponsors
    $('img.sps-image').click(function () {
      window.location.hash = '#/sponsors/'+this.id;
    })
  })
  
  app.s.run();
});
