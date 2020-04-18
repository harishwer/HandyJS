// Enter Apple HLS M3U8 Playlist URL
var myplaylisturl = "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8";

// Enter Bandwidth Value in kbps (Applicable only if Bandwidth based stream selection available in M3U8 Playlist & Needs to be Higher than the Lowest Available Bit Rate)
var mykbps = 2048;

// Number of Segments to be Downloaded
var segnum = 5;

// Randomize Segments Picking
var randseg = "true";

////////////////////////////
// DON'T TOUCH BELOW CODE //
////////////////////////////

function absoluteUrlGen()
{
    // The Previously Loaded URL is arguments[0] & the URL Given is arguments[1]
    // Base URL & Folder Path URL is generated from the Previously Loaded URL
    var baseurl = new URL(arguments[0]).origin;
    var foldersplit = new URL(arguments[0]).pathname.split('/');
    var folderpathurl = new URL(arguments[0]).origin;
    for (i = 0; i < foldersplit.length - 1; i++)
    {
        folderpathurl += foldersplit[i] + "/";
    }

    if (arguments[1].match(/(^\/\/)|((^http|^https)\:\/\/)/))
    {
        return arguments[1];
    }
    if (arguments[1].match(/^\//))
    {
        return baseurl + arguments[1];
    }
    else
    {
        return folderpathurl + arguments[1];
    }
}

function downloadSegments()
{
    // arguments[0] - Segments Playlist URL
    // arguments[1] - Number of Segments to Pick
    // arguments[2] - Randomize Pick of Segments = "true" or "false"
    // arguments[3] - Playlist File Text

    var segmentm3u8lines = arguments[3].split('\n');
    var availsegments = [];
    var j = 0;
    var regex = /\#EXTINF\:/i;
    var found;
    for (i = 0; i < segmentm3u8lines.length; i++)
    {
        found = segmentm3u8lines[i].match(regex);
        if (found !== null && found.length > 0)
        {
            availsegments[j] = segmentm3u8lines[i + 1];
            j++;
        }
    }

    var mysegurls = [];

    if (arguments[2] == "true")
    {
        for (k = 0; k < arguments[1]; k++)
        {
            mysegurls[k] = absoluteUrlGen(arguments[0], availsegments[Math.floor((Math.random() * (availsegments.length - 1)) + 0)]);
        }
    }
    else
    {
        for (k = 0; k < arguments[1]; k++)
        {
            mysegurls[k] = absoluteUrlGen(arguments[0], availsegments[k]);
        }
    }


    for (i = 0; i < arguments[1]; i++)
    {
        var segxhttp = new XMLHttpRequest();
        segxhttp.open("GET", mysegurls[i], false);
        segxhttp.send();
    }


}

var playlisttext;

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function()
{
    if (this.readyState == 4 && this.status == 200)
    {
        playlisttext = this.responseText;
        var playlistlines = playlisttext.split('\n');
        foundbw = false;
        foundsegment = false;
        for (var i = 0; i < playlistlines.length; i++)
        {
            var bwstreamsregex = /\#EXT-X-STREAM-INF.*BANDWIDTH=\d+/i;
            var segmentsregex = /\#EXTINF\:/i;
            var matchbw = playlistlines[i].match(bwstreamsregex);
            var matchsegment = playlistlines[i].match(segmentsregex);

            if (matchbw)
            {
                foundbw = true;
            }
            if (matchsegment)
            {
                foundsegment = true;
            }
        }

        if ((foundbw && foundsegment) || (!foundbw && !foundsegment))
        {
            console.log("Warning / Abort: Invalid or Unexpected Playlist File!!");
        }
        else
        {
            if (foundbw)
            {
                console.log("Found Bandwidth Stream!!");
                var streamm3u8lines = playlisttext.split('\n');
                var availbitr = [];
                var bitrstreamurl = [];
                var j = 0;
                for (var i = 0; i < streamm3u8lines.length; i++)
                {
                    var regex = /EXT-X-STREAM-INF.*BANDWIDTH=(\d+)/i;
                    var found = streamm3u8lines[i].match(regex);
                    if (found !== null && found.length > 1)
                    {
                        availbitr[j] = found[1];
                        bitrstreamurl[j] = streamm3u8lines[i + 1];
                        j++;
                    }
                }
                var mybitr = 1000 * mykbps,
                    lasthighbitr = 0;

                if (availbitr.length == 1)
                {
                    lasthighbitr = availbitr[0];
                }
                else if (availbitr.length > 1)
                {
                    for (i = 0; i < availbitr.length; i++)
                    {
                        if ((availbitr[i] < mybitr) && (availbitr[i] > lasthighbitr))
                        {
                            lasthighbitr = availbitr[i];
                        }
                    }

                }

                var selectbitr = lasthighbitr;
                for (i = 0; i < availbitr.length; i++)
                {
                    if (availbitr[i] == selectbitr)
                    {
                        var selectStreamUrl = bitrstreamurl[i];
                    }
                }
                console.log("The Selected Bitrate is " + selectbitr);
                console.log("The Playlist File for the selected bitrate is " + selectStreamUrl);
                var segmentsplaylist = absoluteUrlGen(myplaylisturl, selectStreamUrl);
                console.log("The Absolute URL for Playlist File for the selected bitrate is " + segmentsplaylist);

                var streamxhttp = new XMLHttpRequest();
                streamxhttp.onreadystatechange = function()
                {
                    if (this.readyState == 4 && this.status == 200)
                    {
                        streamplaylisttext = this.responseText;
                        downloadSegments(segmentsplaylist, segnum, randseg, streamplaylisttext);
                    }
                }
                streamxhttp.open("GET", segmentsplaylist, true);
                streamxhttp.send();


            }
            if (foundsegment)
            {
                console.log("Found Stream of Segments!!");
                var segmentsplaylist = myplaylisturl;
                downloadSegments(segmentsplaylist, segnum, randseg, playlisttext);
            }
        }
    }
}

xhttp.open("GET", myplaylisturl, true);
xhttp.send();



/* CODE AUTHOR: Mr.X

██████╗ ██╗██╗   ██╗ █████╗ ██╗          ██████╗  ██████╗ ██████╗ ███████╗    ████████╗██╗    ██╗██╗███╗   ██╗
██╔══██╗██║██║   ██║██╔══██╗██║         ██╔════╝ ██╔═══██╗██╔══██╗██╔════╝    ╚══██╔══╝██║    ██║██║████╗  ██║
██████╔╝██║██║   ██║███████║██║         ██║  ███╗██║   ██║██║  ██║███████╗       ██║   ██║ █╗ ██║██║██╔██╗ ██║
██╔══██╗██║╚██╗ ██╔╝██╔══██║██║         ██║   ██║██║   ██║██║  ██║╚════██║       ██║   ██║███╗██║██║██║╚██╗██║
██║  ██║██║ ╚████╔╝ ██║  ██║███████╗    ╚██████╔╝╚██████╔╝██████╔╝███████║       ██║   ╚███╔███╔╝██║██║ ╚████║
╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝     ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝       ╚═╝    ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝

*/
