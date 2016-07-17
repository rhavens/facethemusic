Globals = {};
Globals.AccessToken = {};

$(document).ready(function() {
    loadAlbums();
    scrollThingsIntoView();
    $.when(getSpotifyData()).then(function() { moreReady() });
});

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