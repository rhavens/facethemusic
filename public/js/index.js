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

    $(document).bind('keydown', 'space', function(e){
        console.log('snapshot');
        Webcam.snap( function(data_uri) {document.getElementById('results').innerHTML = '<img src="'+data_uri+'"/>';} );
    });
    
    };



function loadAlbums() {
    $.ajax({
        url: 'json/i640.json',
        dataType: 'json',
        success: function(data) {
            var div = $('.album-body');
            var rows = div.find('.row');
            $.each(data, function(k,v) {
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