$(document).ready(function() {
    loadAlbums();
    scrollThingsIntoView();
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