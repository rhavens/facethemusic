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
    })
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
    Webcam.attach( '#my_camera' );
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
    var surprised_genre = ['club','opera','party','romance'];
    var angry_genre = ['alternative','dubstep','death-metal','hip-hop','punk','rock','work-out'];
    var neutral_genre = ['chill','classical','rock','jazz'];

    var options = {}
    var seed_genres, target_energy, target_valence, target_danceability, target_tempo,
        target_loudness, min_popularity=0.6, target_popularity=0.7;
    switch (emotion) {
        case 'happy':
            options.target_energy = 0.8;
            options.target_valence = 0.8;
            options.target_danceability = 0.8;
            options.target_loudness = 0.5;
            options.target_tempo = 120;
            break;
        case 'sad':
            options.target_energy = 0.3;
            options.target_valence = 0.2;
            options.target_danceability = 0.2;
            options.target_loudness = 0.3;
            options.target_tempo = 80;
            break;
        case 'surprised':
            options.target_energy = 1.0;
            options.target_valence = 0.5;
            options.target_danceability = 1.0;
            options.target_loudness = 1.0;
            options.target_tempo = 160;
            break;
        case 'angry':
            options.target_energy = 0.8;
            options.target_valence = 0.3;
            options.target_danceability = 0.8;
            options.target_loudness = 1.0;
            options.target_tempo = 140;
            break;
        case 'neutral':
            options.target_energy = 0.4;
            options.target_valence = 0.5;
            options.target_danceability = 0.4;
            options.target_loudness = 0.6;
            options.target_tempo = 120;
            break;
    }
    options.min_popularity = 0.6;
    options.target_popularity = 0.8;

    var tgurl = 'https://api.spotify.com/v1/recommendations?';
    for (i in options) {
        url += i + '=' + options[i] + '&';
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
}