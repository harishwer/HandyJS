// Enter Smooth Manifest URL
var myplaylisturl = "http://playready.directtaps.net/smoothstreaming/TTLSS720VC1/To_The_Limit_720.ism/Manifest";

// Enter Bandwidth Value in kbps (Applicable only if Bandwidth based stream selection available in M3U8 Playlist & Needs to be Higher than the Lowest Available Bit Rate)
var mykbps = 2048;

// Number of Segments/Fragments to be Downloaded
var segnum = 3;

// Randomize Segment Picking
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

var myxml;

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function()
{
    if (this.readyState == 4 && this.status == 200)
    {
        myxml = this.responseText;
        var myxmlparser = new DOMParser();
        var myxmldoc = myxmlparser.parseFromString(myxml, 'application/xml');

        var xSI = myxmldoc.getElementsByTagName('StreamIndex'),
            audSI, vidSI;
        for (i = 0; i < xSI.length; i++)
        {
            if (xSI[i].getAttribute('Type') == 'audio')
            {
                audSI = i;
            }
            if (xSI[i].getAttribute('Type') == 'video')
            {
                vidSI = i;
            }
        }

        var vidQLBitRates = [],
            audQLBitRates = [],
            vidFrags = [],
            audFrags = [];

        var j = 0;
        for (i = 0; i < xSI[audSI].childElementCount; i++)
        {
            if (xSI[audSI].children[i].nodeName == 'QualityLevel')
            {
                audQLBitRates[j] = xSI[audSI].children[i].getAttribute('Bitrate');
                j++;
            }
        }
        var j = 0;
        for (i = 0; i < xSI[vidSI].childElementCount; i++)
        {
            if (xSI[vidSI].children[i].nodeName == 'QualityLevel')
            {
                vidQLBitRates[j] = xSI[vidSI].children[i].getAttribute('Bitrate');
                j++;
            }
        }
        var j = 0;
        for (i = 0; i < xSI[audSI].childElementCount; i++)
        {
            if (xSI[audSI].children[i].nodeName == 'c')
            {
                audFrags[j] = Number(xSI[audSI].children[i].getAttribute('d'));
                j++;
            }
        }
        var j = 0;
        for (i = 0; i < xSI[vidSI].childElementCount; i++)
        {
            if (xSI[vidSI].children[i].nodeName == 'c')
            {
                vidFrags[j] = Number(xSI[vidSI].children[i].getAttribute('d'));
                j++;
            }
        }

        var myvidbitr = 1000 * mykbps,
            lasthighbitr = 0;

        for (i = 0; i < vidQLBitRates.length; i++)
        {
            if ((vidQLBitRates[i] < myvidbitr) && (vidQLBitRates[i] > lasthighbitr))
            {
                lasthighbitr = vidQLBitRates[i];
            }
        }
        var selectVidbitr = lasthighbitr;
        var selectAudbitr = audQLBitRates[0];

        var audTempUrl = absoluteUrlGen(myplaylisturl, xSI[audSI].getAttribute('Url')).replace('{bitrate}', selectAudbitr);
        var vidTempUrl = absoluteUrlGen(myplaylisturl, xSI[vidSI].getAttribute('Url')).replace('{bitrate}', selectVidbitr);

        var myAudFragUrls = [],
            myVidFragUrls = [];

        for (l = audFrags.length; l > 0; l--)
        {
            audFrags[l] = audFrags[l - 1];
        }
        for (l = vidFrags.length; l > 0; l--)
        {
            vidFrags[l] = vidFrags[l - 1];
        }
        audFrags[0] = 0, vidFrags[0] = 0;

        for (m = 1; m < audFrags.length; m++)
        {
            audFrags[m] += audFrags[m - 1];
        }
        for (m = 1; m < vidFrags.length; m++)
        {
            vidFrags[m] += vidFrags[m - 1];
        }

        if (randseg == "true")
        {
            for (k = 0; k < segnum; k++)
            {
                myAudFragUrls[k] = audTempUrl.replace('{start time}', audFrags[Math.floor((Math.random() * (audFrags.length - 1)) + 0)]);
                myVidFragUrls[k] = vidTempUrl.replace('{start time}', vidFrags[Math.floor((Math.random() * (vidFrags.length - 1)) + 0)]);

            }
        }
        else
        {
            for (k = 0; k < segnum; k++)
            {
                myAudFragUrls[k] = audTempUrl.replace('{start time}', audFrags[k]);
                myVidFragUrls[k] = vidTempUrl.replace('{start time}', vidFrags[k]);

            }
        }


        for (i = 0; i < segnum; i++)
        {
            var vidFragXHttp = new XMLHttpRequest();
            vidFragXHttp.open("GET", myVidFragUrls[i], false);
            vidFragXHttp.send();
            var audFragXHttp = new XMLHttpRequest();
            audFragXHttp.open("GET", myAudFragUrls[i], false);
            audFragXHttp.send();
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
