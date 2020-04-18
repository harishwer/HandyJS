// MPEG Dash MPD Manifest URL
//var myplaylisturl = "https://bitmovin-a.akamaihd.net/content/playhouse-vr/mpds/105560.mpd"; //SegTemp (Number Based) sibling to Rep
//var myplaylisturl = "https://gist.githubusercontent.com/shankardevy/cfe77acd9fe7bded116c/raw/6168390c9d0aae247c5de0cfd02e6f6680a19ce3/gistfile1.xml"; //SegTemp (Time Based) sibling to Rep
var myplaylisturl = "http://dash.edgesuite.net/dash264/TestCases/1a/netflix/exMPD_BIP_TC1.mpd"; // SegBase  inside Rep
//var myplaylisturl = "https://bitdash-a.akamaihd.net/content/sintel/sintel.mpd"; // SegmentTemp (Time Based) inside Rep
//var myplaylisturl = "https://raw.githubusercontent.com/zencoder/go-dash/master/mpd/fixtures/segment_list.mpd"; //SegmentList inside Rep
//var myplaylisturl = "https://raw.githubusercontent.com/harishwer/HandyJS/master/Streaming%20Monitors/Sample%20Manifests/mpeg-dash1.manifest.mpd"; // Only Base, No Seg

/*

DISCLAIMER: For this Monitor to Work, below conditions are mandatory to be fulfilled in the Manifest
1.) mediaPresentationDuration Parameter is Mandatory in MPD Tag
2.) mimeType Parameter should be a part of Adaptation Set and NOT the Representation

*/

//////////////////

// Enter Bandwidth Value in kbps (Applicable only if Bandwidth based stream selection available in Manifest & Needs to be Higher than the Lowest Available Bit Rate)
var mykbps = 2048;

// Number of Segments to be Downloaded
var segnum = 3;

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

function detectSFandDownSegment()
{
    // Adaptation Set is arguments[0]
    var myAS = arguments[0];
    var segTempPresent = 'false',
        segBasePresent = 'false',
        segListPresent = 'false';
    var segmentsUrl = [],
        mysegurls = [],
        RSBitRates = [],
        segBaseHeaderRanges = [];


    //////////
    // RS BW Calc Logic
    var j = 0;
    for (i = 0; i < myAS.childElementCount; i++)
    {
        if (myAS.children[i].nodeName == 'Representation')
        {
            RSBitRates[j] = myAS.children[i].getAttribute('bandwidth');
            j++;
        }
    }

    var myvidbitr = 1000 * mykbps,
        lasthighbitr = 0;

    if (RSBitRates.length = 1)
    {
        lasthighbitr = RSBitRates[0];
    }
    else if (RSBitRates.length > 1)
    {
        for (i = 0; i < RSBitRates.length; i++)
        {
            if ((RSBitRates[i] < myvidbitr) && (RSBitRates[i] > lasthighbitr))
            {
                lasthighbitr = RSBitRates[i];
            }
        }
    }

    var selectRSIndex;

    for (i = 0; i < myAS.childElementCount; i++)
    {
        if (myAS.children[i].nodeName == 'Representation' && myAS.children[i].getAttribute('bandwidth') == lasthighbitr)
        {
            selectRSIndex = i;
        }
    }




    ////////////////////////////
    // Manifest Detection Logic

    if (myAS.children[selectRSIndex].childElementCount == 1 && myAS.children[selectRSIndex].children[0].tagName == 'BaseURL') //Only Base & No Segments || RS has exact only 1 child, which is Base URL
    {
        segmentsUrl[0] = absoluteUrlGen(myplaylisturl, myAS.children[selectRSIndex].children[0].innerHTML);
    }

    else if (myAS.children[selectRSIndex].childElementCount > 0) //RS Has >= 1 children
    {
        for (k = 0; k < myAS.children[selectRSIndex].childElementCount; k++) // Logic to Check if List or Template or Base
        {
            if (myAS.children[selectRSIndex].children[k].tagName == 'SegmentBase')
            {
                segBasePresent = 'true';
            }

            else if (myAS.children[selectRSIndex].children[k].tagName == 'SegmentTemplate')
            {
                segTempPresent = 'true';
            }

            else if (myAS.children[selectRSIndex].children[k].tagName == 'SegmentList')
            {
                segListPresent = 'true';
            }
        }

        if (segListPresent == 'true') //segListPresent
        {
            var l;
            for (k = 0; k < myAS.children[selectRSIndex].childElementCount; k++)
            {
                if (myAS.children[selectRSIndex].children[k].tagName == 'SegmentList')
                {
                    l = k;
                }
            }

            var q = 0;
            for (p = 0; p < myAS.children[selectRSIndex].children[l].childElementCount; p++)
            {
                if (myAS.children[selectRSIndex].children[l].children[p].tagName == 'Initialization')
                {
                    segmentsUrl[q] = absoluteUrlGen(myplaylisturl, myAS.children[selectRSIndex].children[l].children[p].getAttribute('sourceURL'));
                    q++;
                }

                if (myAS.children[selectRSIndex].children[l].children[p].tagName == 'SegmentURL')
                {
                    segmentsUrl[q] = absoluteUrlGen(myplaylisturl, myAS.children[selectRSIndex].children[l].children[p].getAttribute('media'));
                    q++;
                }
            }
        }

        else if (segTempPresent == 'true') //segTempPresent
        {
            var l;
            for (k = 0; k < myAS.children[selectRSIndex].childElementCount; k++)
            {
                if (myAS.children[selectRSIndex].children[k].tagName == 'SegmentTemplate')
                {
                    segTempPresent = 'true';
                    l = k;
                }
            }

            if (myAS.children[selectRSIndex].children[l].childElementCount > 0 && myAS.children[selectRSIndex].children[l].children[0].tagName == 'SegmentTimeline') //Child is SegTemp & Time Based
            {

                var durationTimeline = [],
                    durationLengths = [];
                if (myAS.children[selectRSIndex].children[l].children[0].childElementCount == 1)
                {
                    var rec = Number(myAS.children[selectRSIndex].children[l].children[0].children[0].getAttribute('r'));
                    durationTimeline[0] = 0;
                    for (p = 1; p < rec; p++)
                    {
                        durationTimeline[p] = p * Number(myAS.children[selectRSIndex].children[l].children[0].children[0].getAttribute('d'));
                    }
                }
                else
                {
                    for (r = 0; r < myAS.children[selectRSIndex].children[l].children[0].childElementCount; r++)
                    {
                        durationLengths[r] = Number(myAS.children[selectRSIndex].children[l].children[0].children[r].getAttribute('d'));
                        durationTimeline[r] = 0;
                        for (q = r; q >= 0; q--)
                        {
                            durationTimeline[r] += durationLengths[q];
                        }
                    }
                }
                segmentsUrl[0] = absoluteUrlGen(myplaylisturl, myAS.children[selectRSIndex].children[l].getAttribute('initialization').replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id')));
                for (n = 0; n < durationTimeline.length; n++)
                {
                    segmentsUrl[n + 1] = absoluteUrlGen(myplaylisturl, (myAS.children[selectRSIndex].children[l].getAttribute('media').replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id'))).replace('$Time$', durationTimeline[n]));
                }
            }
            else //Child is SegTemp & Number Based
            {
                var calcNumOfSeg = Number((vidDur / (myAS.children[selectRSIndex].children[l].getAttribute('duration') / myAS.children[selectRSIndex].children[l].getAttribute('timescale'))).toFixed());
                segmentsUrl[0] = absoluteUrlGen(myplaylisturl, myAS.children[selectRSIndex].children[l].getAttribute('initialization')).replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id'));
                for (m = 0; m <= calcNumOfSeg; m++)
                {
                    segmentsUrl[m + 1] = (absoluteUrlGen(myplaylisturl, myAS.children[selectRSIndex].children[l].getAttribute('media')).replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id'))).replace('$Number$', m + 1);
                }
            }

        }

        else if (segBasePresent == 'true') //segBasePresent
        {
            var baseUrlElemNum, segBaseElemNum, segBaseInitElemNum;
            for (k = 0; k < myAS.children[selectRSIndex].childElementCount; k++)
            {
                if (myAS.children[selectRSIndex].children[k].tagName == 'BaseURL')
                {
                    baseUrlElemNum = k;
                }
                if (myAS.children[selectRSIndex].children[k].tagName == 'SegmentBase')
                {
                    segBaseElemNum = k;
                }
            }
            for (k = 0; k < myAS.children[selectRSIndex].children[segBaseElemNum].childElementCount; k++)
            {
                if (myAS.children[selectRSIndex].children[segBaseElemNum].children[k].tagName == 'Initialization')
                {
                    segBaseInitElemNum = k;
                }
            }

            segmentsUrl[0] = absoluteUrlGen(myplaylisturl, myAS.children[selectRSIndex].children[baseUrlElemNum].innerHTML);
            segBaseHeaderRanges = [myAS.children[selectRSIndex].children[segBaseElemNum].children[segBaseInitElemNum].getAttribute('range'), myAS.children[selectRSIndex].children[segBaseElemNum].getAttribute('indexRange')];
        }

        else if (segListPresent == 'false' && segTempPresent == 'false' && segBasePresent == 'false') // None of them
        {
            console.log("Warning / Abort: Invalid Segments Definition!!");
        }

    }

    else if (myAS.children[selectRSIndex].childElementCount == 0) // RS Has No(0) children & Check Sibling Logic
    {

        var l;
        for (k = 0; k < myAS.childElementCount; k++)
        {
            if (myAS.children[k].tagName == 'SegmentTemplate')
            {
                segTempPresent = 'true';
                l = k;
            }
        }

        if (segTempPresent == 'true')
        {
            if (myAS.children[l].childElementCount > 0 && myAS.children[l].children[0].tagName == 'SegmentTimeline') //Sibling is SegTemp & Time Based
            {

                var durationTimeline = [],
                    durationLengths = [];
                if (myAS.children[l].children[0].childElementCount == 1)
                {
                    var rec = Number(myAS.children[l].children[0].children[0].getAttribute('r'));
                    durationTimeline[0] = 0;
                    for (p = 1; p < rec; p++)
                    {
                        durationTimeline[p] = p * Number(myAS.children[l].children[0].children[0].getAttribute('d'));
                    }
                }
                else
                {
                    for (r = 0; r < myAS.children[l].children[0].childElementCount; r++)
                    {
                        durationLengths[r] = Number(myAS.children[l].children[0].children[r].getAttribute('d'));
                        durationTimeline[r] = 0;
                        for (q = r; q >= 0; q--)
                        {
                            durationTimeline[r] += durationLengths[q];
                        }
                    }
                }
                segmentsUrl[0] = absoluteUrlGen(myplaylisturl, myAS.children[l].getAttribute('initialization').replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id')));
                for (n = 0; n < durationTimeline.length; n++)
                {
                    segmentsUrl[n + 1] = absoluteUrlGen(myplaylisturl, (myAS.children[l].getAttribute('media').replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id'))).replace('$Time$', durationTimeline[n]));
                }
            }
            else //Sibling is SegTemp & Number Based
            {
                var calcNumOfSeg = Number((vidDur / (myAS.children[l].getAttribute('duration') / myAS.children[l].getAttribute('timescale'))).toFixed());
                segmentsUrl[0] = absoluteUrlGen(myplaylisturl, myAS.children[l].getAttribute('initialization')).replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id'));
                for (m = 0; m <= calcNumOfSeg; m++)
                {
                    segmentsUrl[m + 1] = (absoluteUrlGen(myplaylisturl, myAS.children[l].getAttribute('media')).replace('$RepresentationID$', myAS.children[selectRSIndex].getAttribute('id'))).replace('$Number$', m + 1);
                }
            }
        }
    }




    ////////////////////////////
    // Download Segment Logic
    if (segmentsUrl[0] == undefined) // Prev condition -=> segBasePresent == 'false' && segTempPresent == 'false' && segListPresent == 'false'
    {
        console.log("Warning / Abort: Invalid MPD Detected!!");
    }
    else
    {

        if (segBaseHeaderRanges.length > 0)
        {
            console.log(segmentsUrl + "\n The Initialization Range is bytes=" + segBaseHeaderRanges[0] + " and the Media Range is bytes=" + segBaseHeaderRanges[1]);
            for (r = 0; r < segBaseHeaderRanges.length; r++)
            {
                var segxhttp = new XMLHttpRequest();
                segxhttp.open("GET", segmentsUrl[0], false);
                segxhttp.setRequestHeader('Range', 'bytes=' + segBaseHeaderRanges[r]);
                segxhttp.send();
            }

        }
        else
        {
            console.log(segmentsUrl);
            if (randseg == "true")
            {
                for (k = 0; k < segnum; k++)
                {
                    mysegurls[k] = segmentsUrl[Math.floor((Math.random() * (segmentsUrl.length - 1)) + 0)];
                }
            }
            else
            {
                for (k = 0; k < segnum; k++)
                {
                    mysegurls[k] = segmentsUrl[k];
                }
            }

            for (r = 0; r < segnum; r++)
            {
                var segxhttp = new XMLHttpRequest();
                segxhttp.open("GET", mysegurls[r], false);
                segxhttp.send();
            }
        }
    }

    ////////////////////////////
}

var myxml;
var vidDur, HH = 0,
    MM = 0,
    SS = 0;

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function()
{
    if (this.readyState == 4 && this.status == 200)
    {
        myxml = this.responseText;
        var myxmlparser = new DOMParser();
        var myxmldoc = myxmlparser.parseFromString(myxml, 'application/xml');

        x = myxmldoc.getElementsByTagName('MPD')[0].getAttribute('mediaPresentationDuration');
        x = x.split('T')[1];
        if (x.split('H').length > 1)
        {
            HH = Number(x.split('H')[0]);
            x = x.split('H')[1];
        }
        if (x.split('M').length > 1)
        {
            MM = Number(x.split('M')[0]);
            x = x.split('M')[1];
        }
        if (x.split('S').length > 1)
        {
            SS = Number(Number(x.split('S')[0]).toFixed());
        }
        vidDur = (HH * 60) + (MM * 60) + SS;

        var xAS = myxmldoc.getElementsByTagName('AdaptationSet'),
            audAS, vidAS;

        for (i = 0; i < xAS.length; i++)
        {
            if (xAS[i].getAttribute('mimeType').includes('audio'))
            {
                audAS = i;
            }
            if (xAS[i].getAttribute('mimeType').includes('video'))
            {
                vidAS = i;
            }
        }

        detectSFandDownSegment(xAS[audAS]);
        detectSFandDownSegment(xAS[vidAS]);


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
