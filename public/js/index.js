Globals = {};
Globals.AccessToken = {};
Globals.Data = {}
Globals.modif = [3.3,3.,2.5,1.5];

$(document).ready(function() {
    loadAlbums();
    scrollThingsIntoView();
    initEventListeners();
    initWebcam();
    test();
    $('#startbutton').click();
    $.when(getSpotifyData()).then(function() { moreReady() });
});

function initEventListeners(){
    $(document).keyup(function(e){
        if (e.keyCode == 32) { //space
            if (Globals.Enabled) {
                Globals.Enabled = false;
                console.log('snapshot');
                take_snapshot();
                Globals.Data = d3.selectAll('rect').data();
            }
        }
        else if (e.keyCode == 73) {
            toggleStats();
        }
    });
};



function loadAlbums() {
    $.ajax({
        url: 'json/i640.json',
        dataType: 'json',
        success: function(data) {
            var div = $('.album-body');
            var rows = div.find('.row');
            $.each( data, function(k,v) {
                $(rows[k%4]).append($('<img>').attr('src',v).addClass('album-image'));
            });
        }
    });
}

// todo
function scrollThingsIntoView() {

}

function toggleStats() {
    $('#stats').toggleClass('hidden');
    $('#container').toggleClass('hidden');
}

function initWebcam() {
    Webcam.set({
      width: 600,
      height:600,
      dest_width: 250,         // size of captured image
      dest_height: 250,
      image_format: 'jpeg',
      jpeg_quality: 100
    });
    Webcam.attach( '#live-webcam' );
}

function getSpotifyData() {
    return $.ajax({
        url: 'get_token',
        dataType: 'json',
        success: function(data) {
            if ('access_token' in data) { // success
                Globals.AccessToken = data.access_token;
                Globals.AccessTokenExpiry = new Date().getTime() + data.expires_in;
            }
        }
    });
}

function moreReady() {
    Globals.Enabled = true;
    console.log(Globals.AccessToken);
}

function take_snapshot() {
    // take snapshot and get image data
    Webcam.snap( function(data_uri) {
        // console.log(data_uri);

        // display results in page
        document.getElementById('results').innerHTML = 
          '<img src="'+data_uri+'"/>';

        getVisionInfo(data_uri);
    });
}

function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}

function getVisionInfo(image) {
    var oReq = new XMLHttpRequest();
    oReq.open("POST",'get_vision_info',true);
    oReq.onload = function (oEvent) {
        console.log(oEvent);
    };
    oReq.onreadystatechange = function() {
        if (oReq.readyState === XMLHttpRequest.DONE && oReq.status === 200) {
            console.log(oReq.responseText);
            var data = JSON.parse(oReq.responseText);

            var joy = data.joy/4. + Globals.modif[3]*Globals.Data[3].value;
            var sad = data.sad/2. + Globals.modif[1]*Globals.Data[1].value;
            var angry = data.anger/3. + Globals.modif[0]*Globals.Data[0].value;
            var surprise = data.surprise/2. + Globals.modif[2]*Globals.Data[2].value;

            console.log(joy,sad,angry,surprise);

            var emotions = [joy,sad,angry,surprise];
            var mostProminent = indexOfMax(emotions);

            if (mostProminent == 0) {
                mapToMusic('happy');
            }
            else if (mostProminent == 1) {
                mapToMusic('sad')
            }
            else if (mostProminent == 2) {
                mapToMusic('angry')
            }
            else {
                mapToMusic('surprise');
            }

            // if (data.joy >= 3) {
            //     mapToMusic('happy');
            // }
            // else if (data.sad >= 3) {
            //     mapToMusic('sad');
            // }
            // else if (data.anger >= 3) {
            //     mapToMusic('angry');
            // }
            // else if (data.surprise >= 3) {
            //     mapToMusic('surprise');
            // }
            // else if (data.joy <= 3) {
            //     mapToMusic('happy');
            // }
            // else if (data.sad <= 3) {
            //     mapToMusic('sad');
            // }
            // else if (data.anger <= 3) {
            //     mapToMusic('angry');
            // }
            // else if (data.surprise == ) {
            //     mapToMusic('surprise');
            // }
            // else {
            //     mapToMusic('neutral');
            // }
        }
    };
    image = image.replace('data:image/jpeg;base64,','');
    var blob = new Blob([image], {type: 'text/plain'});

    oReq.send(blob);
    // console.log(image);
    // return $.ajax({
    //     url: 'get_vision_info?image=' + encodeURIComponent(image),
    //     headers: {'Content-type':'image/jpeg'},
    //     dataType: 'json',
    //     success: function(data) {
    //         if ('access_token' in data) { // success
    //             console.log(image);
    //             console.log(data);
    //         }
    //     }
    // });
}

function mapToMusic(emotion) {
    var genre_seeds = ["alternative", "blues", "chill", "classical", "club",
                       "death-metal", "disco", "dubstep", "edm", "emo", "funk", 
                       "grunge", "hip-hop", "house", "jazz", "opera", "party", 
                       "punk", "rock", "romance", "sad", "work-out"];
    var happy_genre = ['alternative','club','disco','edm','funk'];
    var sad_genre = ['blues','rainy-day','emo','grunge','sad'];
    var surprise_genre = ['club','opera','party','romance'];
    var angry_genre = ['dubstep','death-metal','hip-hop','work-out'];
    var neutral_genre = ['chill','classical','rock','jazz'];

    var options = {}
    var seed_genres, target_energy, target_valence, target_danceability, target_tempo,
        target_loudness, min_popularity=60, target_popularity=70;
    switch (emotion) {
        case 'happy':
            $('#display-text').html('Feeling good?');
            options.target_energy = 0.8;
            options.target_valence = 0.8;
            options.target_danceability = 0.8;
            options.target_loudness = -30;
            options.target_tempo = 120;
            options.seed_genres = happy_genre.join(',');
            break;
        case 'sad':
            $('#display-text').html("It's okay to cry...");
            options.target_energy = 0.3;
            options.target_valence = 0.2;
            options.target_danceability = 0.1;
            options.target_loudness = -20;
            options.target_tempo = 70;
            options.seed_genres = sad_genre.join(',');
            break;
        case 'surprise':
            $('#display-text').html("WHOA!");
            options.target_energy = 1.0;
            options.target_valence = 0.5;
            options.target_danceability = 1.0;
            options.target_loudness = -55;
            options.target_tempo = 160;
            options.seed_genres = surprise_genre.join(',');
            break;
        case 'angry':
            $('#display-text').html("Get angry!");
            options.target_energy = 0.8;
            options.target_valence = 0.3;
            options.target_danceability = 0.8;
            options.target_loudness = -70;
            options.target_tempo = 140;
            options.seed_genres = angry_genre.join(',');
            break;
        case 'neutral':
            $('#display-text').html("Try it again with more emotion");
            options.target_energy = 0.4;
            options.target_valence = 0.5;
            options.target_danceability = 0.4;
            options.target_loudness = -40;
            options.target_tempo = 120;
            options.seed_genres = neutral_genre.join(',');
            break;
    }
    options.min_popularity = min_popularity;
    options.target_popularity = target_popularity;

    var tgurl = 'https://api.spotify.com/v1/recommendations?limit=20&';
    for (i in options) {
        tgurl += i + '=' + options[i] + '&';
    }

    try {
        $.ajax({
            url: tgurl,
            dataType: 'json',
            headers: { 'Authorization': 'Bearer ' + Globals.AccessToken },
            json: true,
            success: function(data) {
                renderSpotifyMusic(data);
            }
        });
    }
    catch (e) {
        console.log(e);
    }
}

function renderSpotifyMusic(data) {
    var real_data = data['tracks'];
    var len = real_data.length;
    var choice = Math.floor(Math.random()*len);
    var songObj = {};
    songObj = real_data[choice];
    console.log(songObj);

    var audio = $('audio');
    if (audio.length) {
        audio.get(0).pause();
    }
    try {
        $('#music-display').empty();
        var audio = $('<audio controls autoplay><source src='+songObj['preview_url']+' type=audio/mpeg></source></audio>').appendTo('#music-display');
        console.log(audio);
        $('<iframe src="https://embed.spotify.com/?uri='+ songObj['uri'] +'" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>').appendTo('#music-display');
    }
    catch (e) {
        console.log(e);
    }
    Globals.Enabled = true;
}

function test() {


var vid = $('#videoe1').get(0);
var overlay = $('#overlay').get(0);//document.getElementById('overlay');
var overlayCC = overlay.getContext('2d');

console.log(vid);
console.log(document);

/********** check and set up video/webcam **********/

function enablestart() {
    var startbutton = document.getElementById('startbutton');
    startbutton.value = "start";
    startbutton.disabled = null;
}

/*var insertAltVideo = function(video) {
    if (supports_video()) {
        if (supports_ogg_theora_video()) {
            video.src = "../media/cap12_edit.ogv";
        } else if (supports_h264_baseline_video()) {
            video.src = "../media/cap12_edit.mp4";
        } else {
            return false;
        }
        //video.play();
        return true;
    } else return false;
}*/
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// check for camerasupport
if (navigator.getUserMedia) {
    // set up stream
    
    var videoSelector = {video : true};
    if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
        var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
        if (chromeVersion < 20) {
            videoSelector = "video";
        }
    };

    navigator.getUserMedia(videoSelector, function( stream ) {
        if (vid.mozCaptureStream) {
            vid.mozSrcObject = stream;
        } else {
            vid.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
        }
        vid.play();
    }, function() {
        //insertAltVideo(vid);
        alert("There was some problem trying to fetch video from your webcam. If you have a webcam, please make sure to accept when the browser asks for access to your webcam.");
    });
} else {
    //insertAltVideo(vid);
    alert("This demo depends on getUserMedia, which your browser does not seem to support. :(");
}

vid.addEventListener('canplay', function() { startVideo() }, false);

/*********** setup of emotion detection *************/

var ctrack = new clm.tracker({useWebGL : true});
ctrack.init(pModel);

startVideo = function() {
    // start video
    vid.play();
    // start tracking
    ctrack.start(vid);
    // start loop to draw face
    drawLoop();
}

drawLoop = function() {
    requestAnimFrame(drawLoop);
    overlayCC.clearRect(0, 0, 400, 300);
    //psrElement.innerHTML = "score :" + ctrack.getScore().toFixed(4);
    if (ctrack.getCurrentPosition()) {
        ctrack.draw(overlay);
    }
    var cp = ctrack.getCurrentParameters();
    
    var er = ec.meanPredict(cp);
    if (er) {
        updateData(er);
        for (var i = 0;i < er.length;i++) {
            if (er[i].value > 0.4) {
                // document.getElementById('icon'+(i+1)).style.visibility = 'visible';
            } else {
                // document.getElementById('icon'+(i+1)).style.visibility = 'hidden';
            }
        }
    }
}

var ec = new emotionClassifier();
ec.init(emotionModel);
var emotionData = ec.getBlank();    

/************ d3 code for barchart *****************/

var margin = {top : 20, right : 20, bottom : 10, left : 40},
    width = 400 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

var barWidth = 30;

var formatPercent = d3.format(".0%");

var x = d3.scale.linear()
    .domain([0, ec.getEmotions().length]).range([margin.left, width+margin.left]);

var y = d3.scale.linear()
    .domain([0,1]).range([0, height]);

var svg = d3.select("#emotion_chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

svg.selectAll("rect").
  data(emotionData).
  enter().
  append("svg:rect").
  attr("x", function(datum, index) { return x(index); }).
  attr("y", function(datum) { return height - y(datum.value); }).
  attr("height", function(datum) { return y(datum.value); }).
  attr("width", barWidth).
  attr("fill", "#2d578b");

svg.selectAll("text.labels").
  data(emotionData).
  enter().
  append("svg:text").
  attr("x", function(datum, index) { return x(index) + barWidth; }).
  attr("y", function(datum) { return height - y(datum.value); }).
  attr("dx", -barWidth/2).
  attr("dy", "1.2em").
  attr("text-anchor", "middle").
  text(function(datum) { return datum.value;}).
  attr("fill", "white").
  attr("class", "labels");

svg.selectAll("text.yAxis").
  data(emotionData).
  enter().append("svg:text").
  attr("x", function(datum, index) { return x(index) + barWidth; }).
  attr("y", height).
  attr("dx", -barWidth/2).
  attr("text-anchor", "middle").
  attr("style", "font-size: 12").
  text(function(datum) { return datum.emotion;}).
  attr("transform", "translate(0, 18)").
  attr("class", "yAxis");



updateData = function(data) {

    // var joy = data.joy/4. + 1.5*Globals.Data[3].value;
    // var sad = data.sad/2. + 3.*Globals.Data[1].value;
    // var angry = data.anger/3. + 3.3*Globals.Data[0].value;
    // var surprise = data.surprise/2. + 2.5*Globals.Data[2].value;


    // update
    var rects = svg.selectAll("rect")
        .data(data)
        .attr("y", function(datum, index) { return height - Globals.modif[index]*y(datum.value); })
        .attr("height", function(datum, index) { return Globals.modif[index]*y(datum.value); });
    var texts = svg.selectAll("text.labels")
        .data(data)
        .attr("y", function(datum, index) { return height - Globals.modif[index]*y(datum.value); })
        .text(function(datum, index) { return (Globals.modif[index]*datum.value).toFixed(1);});

    // enter 
    rects.enter().append("svg:rect");
    texts.enter().append("svg:text");

    // exit
    rects.exit().remove();
    texts.exit().remove();
}

/******** stats ********/

stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.getElementById('container').appendChild( stats.domElement );

// update stats on every iteration
document.addEventListener('clmtrackrIteration', function(event) {
    stats.update();
}, false);

}