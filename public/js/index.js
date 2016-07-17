Globals = {};
Globals.AccessToken = {};

$(document).ready(function() {
    loadAlbums();
    scrollThingsIntoView();
    initEventListeners();
    initWebcam();
    $.when(getSpotifyData()).then(function() { moreReady() });
});

function initEventListeners(){
    $(document).keyup(function(e){
        if (e.keyCode == 32) { //space
            console.log('snapshot');
            take_snapshot();
        }
    });
    $('body').on('click','iframe', function(e) {
        $('audio').pause();
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
            if (data.joy >= 3) {
                mapToMusic('happy');
            }
            else if (data.sad >= 3) {
                mapToMusic('sad');
            }
            else if (data.anger >= 3) {
                mapToMusic('angry');
            }
            else if (data.surprise >= 3) {
                mapToMusic('surprise');
            }
            else if (data.joy == 2) {
                mapToMusic('happy');
            }
            else if (data.sad == 2) {
                mapToMusic('sad');
            }
            else if (data.anger == 2) {
                mapToMusic('angry');
            }
            else if (data.surprise == 2) {
                mapToMusic('surprise');
            }
            else {
                mapToMusic('neutral');
            }
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
    var sad_genre = ['blues','chill','emo','grunge','sad'];
    var surprise_genre = ['club','opera','party','romance'];
    var angry_genre = ['dubstep','death-metal','hip-hop','punk','work-out'];
    var neutral_genre = ['chill','classical','rock','jazz'];

    var options = {}
    var seed_genres, target_energy, target_valence, target_danceability, target_tempo,
        target_loudness, min_popularity=60, target_popularity=70;
    switch (emotion) {
        case 'happy':
            options.target_energy = 0.8;
            options.target_valence = 0.8;
            options.target_danceability = 0.8;
            options.target_loudness = -30;
            options.target_tempo = 120;
            options.seed_genres = happy_genre.join(',');
            break;
        case 'sad':
            options.target_energy = 0.3;
            options.target_valence = 0.2;
            options.target_danceability = 0.2;
            options.target_loudness = -20;
            options.target_tempo = 80;
            options.seed_genres = sad_genre.join(',');
            break;
        case 'surprise':
            options.target_energy = 1.0;
            options.target_valence = 0.5;
            options.target_danceability = 1.0;
            options.target_loudness = -55;
            options.target_tempo = 160;
            options.seed_genres = surprise_genre.join(',');
            break;
        case 'angry':
            options.target_energy = 0.8;
            options.target_valence = 0.3;
            options.target_danceability = 0.8;
            options.target_loudness = -60;
            options.target_tempo = 140;
            options.seed_genres = angry_genre.join(',');
            break;
        case 'neutral':
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

    var tgurl = 'https://api.spotify.com/v1/recommendations?limit=10&';
    for (i in options) {
        tgurl += i + '=' + options[i] + '&';
    }

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

function renderSpotifyMusic(data) {
    var real_data = data['tracks'];
    var len = real_data.length;
    var choice = Math.floor(Math.random()*len);
    var songObj = {};
    songObj = real_data[choice];
    console.log(songObj);

    var audio = $('<audio controls autoplay><source src='+songObj['preview_url']+' type=audio/mpeg></source></audio>').appendTo('#music-display');
    console.log(audio);
    $('<iframe src="https://embed.spotify.com/?uri='+ songObj['uri'] +'" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>').appendTo('#music-display');
}