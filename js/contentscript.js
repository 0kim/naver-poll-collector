item_regex_pattern = /([\d]+)[\.][ ](([\S\d ]*) ([\d]*)표), ([\d\.]*)%/

function getVoters(link, id, result) {
    return $.Deferred( function() {
        var df = this
        var voters = [];
        var j = 1;
        var exe_count = 0;

        function get_voters_next(stopper ,j) {
            return $.Deferred( function () {
                var p = this
                if (!stopper['flag']) {
                    $.ajax(link + '&page=' + j).then(
                        function (data, textStatus, jqXHR) {
                            output = $($.parseHTML(data)).find('.infos');
                            if (output[0] == undefined) {
                                stopper['flag'] = true;
                            } else {
                                output.find('td').each(function (k, v) {
                                    value = $(v).text();
                                    if (value != '') {
                                        // console.log(id + ": " + j + ":" + voters.length);
                                        voters.push(value)
                                    } else {
                                        //  skip
                                    }
                                });
                            }
                            exe_count++;
                            p.resolve();
                        }
                    );
                }
                else {
                    p.reject();
                }
            });
        }

        function loop_get_voters_next(stopper, i ) {
            if(stopper['flag']) {
                result.push( { id: id, voters: voters } );
                df.resolve();
            } else {
                $.when( get_voters_next(stopper, i) ).then( function() { loop_get_voters_next(stopper, i+1) }, function() {
                    df.reject();
                });
            }
        }

        var stopper = {flag:false};
        loop_get_voters_next(stopper, 1);
    });
}

$( document ).ready( function() {

    var textToSave = 'this is a test';
    var button = "\
        <div class='download_result' \
             style='height:25px; width:80px; background: cornflowerblue; \
                    position:absolute; top:5px;right:10px;border-radius:.3rem; \
                    vertical-align:middle;text-align: center'> \
            <span style='vertical-align:middle;color:white;line-height:1.5rem'> \
                <h3>Download</h3> \
            </span> \
        </div>";

    $('body').append(button);
    $('.download_result').on('click', function() {
        var poll_list = [];
        var voters_list = [];

        // Read items
        i = 0;
        $('.ppt03_list').children().each(function(){
            item = $(this).text();
            link = $(this).find("a").attr('href');

            r  = item.match(item_regex_pattern)

            poll_list.push( {
                'id' : i,
                'rank' : r[1],
                'item' : r[3],
                'vote' : r[4],
                'percent' : r[5],
                'link' : link
            } );
            i++;
        });

        // Read voters for each item
        var promise_array = [];
        poll_list.forEach( function(v, idx, arr) {
            promise_array.push( getVoters('/' + poll_list[idx]['link'], idx, voters_list) );
        });

        // Return output
        $.when.apply($, promise_array).
        then( function() {
            var hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:attachment/text,' + JSON.stringify(poll_list);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'poll_list.txt';
            hiddenElement.click();
            var hiddenElement2 = document.createElement('a');
            hiddenElement2.href = 'data:attachment/text,' + JSON.stringify(voters_list);
            hiddenElement2.target = '_blank';
            hiddenElement2.download = 'voters_list.txt';
            hiddenElement2.click();
        });
    });

});
