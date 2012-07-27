// ==UserScript==
// @name        archive.org AJAX Enhancer
// @namespace   http://archive.org
// @description AJAXify archive.org using the Metadata Write API
// @include     http://archive.org/details/*
// @version     1
// @require     http://archive.org/includes/jquery-1.6.1.js
// ==/UserScript==

(function() {

//If the user doesn't have perms to edit this item, return without ajax-ifying
if (1 != $('a.level3Header').filter(':contains("Edit Item!")').length) return;

$('.x-archive-meta-title').click(function(){
    var text = $(this).text();
    $(this).text('');
    var parent = $(this).parent();

    var input_field   = $('<input type="text" />').val(text);

    var save_button   = $('<button type="button">Save</button>').click(function() {
        var newText = input_field.val();
        //console.log('setting new title to ' + newText);
        $('.x-archive-meta-title').text(newText);
        $(this).parent().remove();
        if (newText == text) return;

        var path = document.location.pathname.split('/');
        if (3 != path.length) {
            alert('could not find archive.org identifier');
            return;
        }
        var identifier = path[2];
        var data =  {"replace": "/title", "value": newText};
        $.getJSON('/metadata/'+identifier, {"-patch": data, "-target":"metadata"},
            function(obj) {
                //console.log('metadata write api returned');
                //console.log(obj);
                if ('error' in obj) {
                    alert('Could not save title due to an error: ' + obj.error);
                }
            }
        );
    });

    var cancel_button = $('<button type="reset">Cancel</button>').click(function() {
        $('.x-archive-meta-title').text(text);
        $(this).parent().remove();
    });

    parent.append($('<div>').append(input_field, save_button, cancel_button));
    input_field.select();

});
})();
