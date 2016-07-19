// // Copyright 2015-2016, Google, Inc.
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //    http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.

// 'use strict';

// var express = require('express');
// var path = require('path');
// var logger = require('morgan');
// var cookieParser = require('cookie-parser');

// var routes = require('./routes/index');
// var users = require('./routes/users');

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// app.use(logger('dev'));

// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);
// app.use('/users', users);

/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

console.log('Starting App...');

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var path = require('path');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var url = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');
var exec = require('child_process').exec;

var gcloud = require('gcloud')({
  keyFilename: './auth/service_account.json',
  projectId: 'instant-gecko-761'
});
var vision = gcloud.vision();

var privateKey = fs.readFileSync('keys/server.key','utf-8');
var certificate = fs.readFileSync('keys/server.crt','utf-8');
var credentials = {key: privateKey, cert: certificate};

var client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
var client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
var redirect_uri = "http://interns.dev.viasatcloud.com:3000/callback"; // Your redirect uri
var azure_key = process.env.AZURE_KEY;


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var removeQueryString = function(item) {
  var obj = url.parse(item);
  obj.search = obj.query = '';
  return url.format(obj);
}

var getFaceValue = function (likelihood){
    switch (likelihood){
        case 'VERY_UNLIKELY':
            return 1;
        case 'UNLIKELY':
            return 2;
        case 'POSSIBLE':
            return 3;
        case 'LIKELY':
            return 4;
        case 'VERY_LIKELY':
            return 5;
        default:
            return 'error'
    }
}

var stateKey = 'spotify_auth_state';

var app = express();


app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

app.get('/', function(req,res) {
  // console.log(res.location());
  // res.url = removeQueryString(res.url);
  var access_token = req.query.access_token,
      refresh_token = req.query.refresh_token;
  if (access_token) {
    res.render('pages/index', {
      access_token: access_token,
      refresh_token: refresh_token
    });
  }
  else {
    res.render('pages/index');
  }
});

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/?' + querystring.stringify(
      {
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/?' + querystring.stringify({
                    access_token: access_token,
                    refresh_token: refresh_token
                  }));
      } else {
        res.redirect('/?' + querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/test', function(req, res) {
  res.render('pages/test', {foo:'bar'});
});



app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;  
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/get_token', function(req, res) {
  res.setHeader('content-type','application/json');
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.send(body);
    }
    else {
      res.send(error);
    }
  });
});

app.get('/get_songs', function(req, res) {
  var emotion = req.query.emotion;
});

app.post('/get_vision_info', function(req, res) {
  res.setHeader('content-type','application/json');
  var body = [];
  req.on('error',function(err) {
    console.log('error in request');
    res.send(err);
  }).on('data', function(chunk) {
    body.push(chunk);
  }).on('end', function() {
    body = Buffer.concat(body).toString();
    fs.writeFileSync('image.jpg',body);
    // fuck it I give up
    var child = exec('cat image.jpg | base64 --decode > ./public/output.jpg', function(error, stdout, stderr) {
      if (error !== null) {
        console.log(error);
        res.send({'error':'error writing image'});
      }
      else {
        vision.detectFaces('public/output.jpg', function(err, faces, apiResponse) {
          var err_p = err || apiResponse.responses[0].error || null;
          if (err_p) {
            console.log('error in google');
            res.send({'error':err_p});
          }
          else {
            try {
              // console.log(JSON.stringify(apiResponse));
              var faceObj = {
                  "joy": getFaceValue(apiResponse.responses[0].faceAnnotations[0].joyLikelihood),
                  "anger": getFaceValue(apiResponse.responses[0].faceAnnotations[0].angerLikelihood),
                  "sad": getFaceValue(apiResponse.responses[0].faceAnnotations[0].sorrowLikelihood),
                  "surprise": getFaceValue(apiResponse.responses[0].faceAnnotations[0].surpriseLikelihood),
                  "hat": getFaceValue(apiResponse.responses[0].faceAnnotations[0].headwearLikelihood)
              }
              console.log(faceObj);
              res.send(faceObj);
              // var authOptions = {
              //   url: 'https://api.projectoxford.ai/emotion/v1.0/recognize',
              //   headers: { 'Content-type': 'application/octet-stream', 'Ocp-Apim-Subscription-Key': azure_key },
              //   data: fs.readFileSync('public/output.jpg'),
              //   processData: false
              // };
              // request.post(authOptions, function(error, response, body) {
              //   if (!error && response.statusCode === 200) {
              //     console.log('good');
              //     res.send(response);
              //   }
              //   else {
              //     console.log('error')
              //     console.log(error);
              //     console.log(response.statusCode);
              //     res.send(error);
              //   }
              // });
              // res.send(faceObj);
            }
            catch (e) {
              res.send({'error':'no face found'});
            }
          }
        });
      }
    });
  });
});

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);

// });
// // error handlers

// // development error handler
// // will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function (err, req, res) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// // production error handler
// // no stacktraces leaked to user
// app.use(function (err, req, res) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(process.env.PORT || 3000, function () {
      console.log('Listening on port ' + process.env.PORT + '...');
});
  


//app.listen(process.env.PORT || 3000);
