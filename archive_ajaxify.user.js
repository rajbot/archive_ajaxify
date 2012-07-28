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

var fields_to_edit = $('.x-archive-meta-title').attr('archive_ajaxify', 'title');
if (1 != fields_to_edit.length) return; //there should only be one title

var metadata_block = $('#midcol').find('.content');
if (1 != metadata_block.length) return;

//The description is a text node. Create an element with the description
//so we can respond to click events.
var description_text_node = metadata_block.contents().first();
if (1 != description_text_node.length) return;
if (description_text_node.get(0).nodeType != Node.TEXT_NODE) return;
var description = $('<span>').attr('archive_ajaxify', 'description').text(description_text_node.text());
//if we use wrap(), then we still can't trigger click event, so replace the text node instead.
description_text_node.replaceWith(description);

fields_to_edit = fields_to_edit.add(description);

fields_to_edit.click(function(){
    var text = $(this).text();
    $(this).text('');

    var element = $(this);
    var parent  = element.parent();

    if ('description' == element.attr('archive_ajaxify')) {
        var input   = $('<textarea />').text(text);
    } else {
        var input   = $('<input type="text" />').val(text);
    }

    var save_button   = $('<button type="button">Save</button>').click(function() {
        var name = element.attr('archive_ajaxify');
        var newText = input.val();

        element.text(newText);
        $(this).parent().remove();
        if (newText == text) return;

        var path = document.location.pathname.split('/');
        if (3 != path.length) {
            alert('could not find archive.org identifier');
            return;
        }
        var identifier = path[2];
        var data =  {"replace": "/"+name, "value": newText};
        $.getJSON('/metadata/'+identifier, {"-patch": data, "-target":"metadata"},
            function(obj) {
                //console.log('metadata write api returned');
                //console.log(obj);
                if (false == obj.success) {
                    alert('Could not save title due to an error: ' + obj.error);
                }
                element.removeAttr('archive_ajaxify');
            }
        );
    });

    var cancel_button = $('<button type="reset">Cancel</button>').click(function() {
        element.text(text);
        $(this).parent().remove();
    });

    $(this).after($('<div>').append(input, save_button, cancel_button));
    input.select();

});
})();
