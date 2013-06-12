// ==UserScript==
// @name        archive.org AJAX Enhancer
// @namespace   https://archive.org
// @description AJAXify archive.org using the Metadata Write API
// @include     https://archive.org/details/*
// @version     2
// @require     https://archive.org/includes/jquery-1.6.1.js
// @grant       GM_addStyle
// ==/UserScript==

var css = [".table { display: table; }",
           ".table_row { display: table-row; height:30px; }",
           ".table_cell { display: table-cell; padding-left: 10px; border-bottom: 1px solid #ccc; vertical-align: middle; min-height:     20px;}",
           ".hover:hover {background-color: #EFEFEF; }",
          ].join("");
GM_addStyle(css);

(function() {

//If the user doesn't have perms to edit this item, return without ajax-ifying
if (1 != $('a.level3Header').filter(':contains("Edit Item!")').length) return;

var path = document.location.pathname.split('/');
if (3 != path.length) {
    alert('could not find archive.org identifier');
    return;
}


var identifier = path[2];
console.log('got id:', identifier)

var fields_to_edit = $();

$.get('/metadata/'+identifier, function(data) {
    console.log('got:'); console.log(data);

    //remove all dom nodes in the midcol, up to the Reviews section
    var midcol = $('#midcol');
    var midcol_box = $('#midcol > .box');
    if (1 != midcol_box.length) return; //there should only be one midcol_box

    $.each(midcol_box.children(), function(i, e) {
        console.log(e);
        if (/Reviews/.test($(e).text())) {
            return false;
        } else {
            $(e).remove()
        }
    });

    var metadata = data['metadata'];

    var prev_element;
    //Add title
    if ('title' in metadata) {
        var title = $('<h1 archive_ajaxify="title">'+metadata['title']+'</h1>');
        console.log(title);
        title.css('font-size', '125%');
        fields_to_edit = fields_to_edit.add(title);
        midcol_box.prepend(title);
        prev_element = title
    } else {
        prev_element = $('<h1>No title</h1>');
        midcol_box.prepend(prev_element);
    }

    var metadata_box = $('<div id="metadata_box"></div>').css('dispaly', 'table').css('width', '100%');
    prev_element.after(metadata_box);
    if ('description' in metadata) {
        var description = $('<div archive_ajaxify="description">'+metadata['description']+'</div>').addClass('hover');
        fields_to_edit = fields_to_edit.add(description);
        metadata_box.append(description);
    }

    var system_metadata = ['addeddate', 'call_number', 'camera', 'collection',
                        'contributor', 'curation',
                        'foldoutcount', 'identifier',
                        'identifier-access', 'identifier-ark', 'imagecount', 'lcamid',
                        'mediatype', 'missingpages', 'ocr', 'operator', 'page-progression',
                        'pick', 'ppi', 'publicdate', 'rcamid',
                        'repub_state', 'scandate', 'scanningcenter',
                        'scanner', 'sponsor', 'sponsordate',
                        'type', 'updatedate', 'updater', 'uploader'];

    var toplevel_metadata = ['title', 'description'];

    var keys = Object.keys(metadata);
    keys.sort();


    var table = $('<div>').addClass('table');
    metadata_box.append('<h2>Metadata that you can edit:</h2>').append(table);
    $.each(keys, function(i, key) {
        if (-1 !== $.inArray(key, system_metadata))   return true; //continue
        if (-1 !== $.inArray(key, toplevel_metadata)) return true; //continue

        if ("object" === typeof(metadata[key])) return true; //for now

        var div = $('<div>').addClass('table_row');
        var k = $('<span class="key table_cell">'+key+':</span>');
        var v = $('<span class="value table_cell hover">'+metadata[key]+'</span>').css('width', '100%');
        v.attr('archive_ajaxify', key);
        div.append(k).append(v);
        table.append(div);
        fields_to_edit = fields_to_edit.add(v);
        //metadata_box.append('<div><span class="key">'+key+':</span> <span class="value">'+metadata[key]+'</span></div>');
    });

    table = $('<div>').addClass('table');
    metadata_box.append('<h2>System Metadata:</h2>').append(table);
    $.each(keys, function(i, key) {
        if (-1 === $.inArray(key, system_metadata))   return true; //continue
        if (-1 !== $.inArray(key, toplevel_metadata)) return true; //continue

        if ("object" === typeof(metadata[key])) return true; //for now

        var div = $('<div>').addClass('table_row');
        var k = $('<span class="key table_cell">'+key+':</span>');
        var v = $('<span class="value table_cell">'+metadata[key]+'</span>');
        div.append(k).append(v);
        table.append(div);

        //metadata_box.append('<div><span class="key">'+key+':</span> <span class="value">'+metadata[key]+'</span></div>');
    });


    //add click handler
    fields_to_edit.click(function(){
        if (undefined === $(this).attr('archive_ajaxify')) {
            alert('this element has no archive_ajaxify attribute!');
            return;
        }

        if ($(this).hasClass('archive_modify')) {
            return;
        } else {
            $(this).addClass('archive_modify');
        }

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
                    } else {
                        element.removeClass('archive_modify');
                    }
                }
            );
        });

        var cancel_button = $('<button type="reset">Cancel</button>').click(function() {
            $(this).parent().remove();
            element.text(text);
            element.removeClass('archive_modify');
            console.log(element);
            return false; //stop propagation
        });

        $(this).append($('<div>').append(input, save_button, cancel_button));
        input.select();

    });
});

})();
