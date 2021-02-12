function AdSlot(_name, _type, _time, _zone) {
    this.name = _name;
    this.type = _type;
    this.time = _time;
    this.zone = _zone;
    this.source = "";
    this.seen = false;
    this.playOnce = true;
}

function convertTimeFormat(hhmmss) {
    return hhmmss.substr(0, 2) * 3600 + hhmmss.substr(2, 2) * 60 + hhmmss.substr(4, 2) * 1;
}

function constructAdList(responseObj) {
    if (responseObj.getElementsByTagName("Linear")[0]) {
        const skipOffset = responseObj.getElementsByTagName("Linear")[0].getAttribute('skipoffset').split(':');
        skipAdsTime = (+skipOffset[0] * 3600) + (+skipOffset[1] * 60) + (+skipOffset[2]);
    }
    if (responseObj.getElementsByTagName("TrackingEvents")[0]) {
        const EventTracks = responseObj.getElementsByTagName("TrackingEvents")[0].children;
        Array.from(EventTracks).forEach(item => {
            switch (item.getAttribute('event')) {
                case 'start':
                    window.startURL = item.textContent.trim()
                    break
                case 'progress':
                    window.progressURL = item.textContent.trim()
                    break
                case 'firstQuartile':
                    window.firstQuartileURL = item.textContent.trim()
                    break
                case 'midpoint':
                    window.midpointURL = item.textContent.trim()
                    break
                case 'thirdQuartile':
                    window.thirdQuartileURL = item.textContent.trim()
                    break
                case 'complete':
                    window.completeURL = item.textContent.trim()
                    break
            }
        })
    }
    if (responseObj.getElementsByTagName("MediaFiles")[0]) {
        const MediaFiles = responseObj.getElementsByTagName("MediaFiles")[0].children;
        for (v in AdList) {
            const mp4Video = Array.from(MediaFiles).filter(item => item.getAttribute('type') === 'video/mp4');
            AdList[v].source = mp4Video[0].textContent.trim();
        }
    }
    if (responseObj.getElementsByTagName("VideoClicks")[0]) {
        const VideoClicks = responseObj.getElementsByTagName("VideoClicks")[0].children;
        const ClickThrough = Array.from(VideoClicks).filter(item => item.getElementsByTagName('ClickThrough'))
        if (ClickThrough && ClickThrough.length > 0) {
            adsClickLink = ClickThrough[0].textContent.trim();
        } else {
            adsClickLink = null;
        }
    } else {
        adsClickLink = null;
    }
    // if (!AdList[0].source) {
    //     videoTag.play();
    //     return;
    // }
    videoTag.addEventListener('timeupdate', showAdSlots, false);
}

// Loading ads data from defined server
AdsRequest = function (AdObj) {
    //constructing list for further populating and sorting
    var i1 = 0;
    var i2 = 0;
    var i3 = 0;
    var i4 = 0;
    var zones = "";
    for (v in AdObj.schedule) {
        switch (AdObj.schedule[v].position) {
            case "pre-roll":
                var a = new AdSlot("pre-roll-" + i1, "pre-roll", 0, AdObj.schedule[v].zone);
                i1++;
                AdList.push(a);
                break
            case "mid-roll":
                var a = new AdSlot("mid-roll-" + i2, "mid-roll", convertTimeFormat(AdObj.schedule[v].startTime), AdObj.schedule[v].zone);
                i2++;
                AdList.push(a);
                break
            case "post-roll":
                var a = new AdSlot("post-roll-" + i3, "post-roll", 0, AdObj.schedule[v].zone);
                i3++;
                AdList.push(a);
                break
            case "auto:bottom":
                var a = new AdSlot("auto:bottom-" + i4, "auto:bottom", convertTimeFormat(AdObj.schedule[v].startTime), AdObj.schedule[v].zone);
                i4++;
                AdList.push(a);
                break
            default:
                break
        }
    }
    videoTag.addEventListener("canplay", setPostRollTime, false);
    videoTag.load();
};


//Parsing parameters from video tag
parseAdsParameters = function (input) {
    return !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(input.replace(/"(\\.|[^"\\])*"/g, ''))) && eval('(' + input + ')');
}

function enforcePrecision(n, nDecimalDigits) {
    return +(n).toFixed(nDecimalDigits);
}

function seekToOriginalPoint() {
    videoTag.removeEventListener('canplaythrough', seekToOriginalPoint, false);
    videoTag.removeEventListener('load', seekToOriginalPoint, false);
    videoTag.currentTime = enforcePrecision(tempTime, 1);
    videoTag.play();
    videoTag.addEventListener('timeupdate', showAdSlots, false);
}

function resumePlayBackAfterSlotShow() {
    videoTag.removeEventListener('ended', resumePlayBackAfterSlotShow, false);
    videoTag.removeEventListener('timeupdate', listenAdsPartTime, false);
    startFired = false;
    proggressFired = false;
    firstQuartileFired = false;
    midpointFired = false;
    thirdQuartileFired = false;
    completeFired = false;
    $(".skipBtn").hide();
    videoTag.src = videoTag.mainTrack;
    videoTag.play();

    if (videoTag.readyState !== 4) { //HAVE_ENOUGH_DATA
        videoTag.addEventListener('canplaythrough', seekToOriginalPoint, false);
        videoTag.addEventListener('load', seekToOriginalPoint, false); //add load event as well to avoid errors, sometimes 'canplaythrough' won't dispatch.
        videoTag.pause();
    }
}

function callAdsTrackApi(url) {
    return new Promise((resolve, reject) => {
        let http_req = new XMLHttpRequest();
        http_req.open("GET", url, true);
        http_req.send(null);
        http_req.onreadystatechange = function () {
            if (http_req.readyState == 4 && http_req.status == 200) {
                http_req = null;
                resolve();
            }
        }
    })
}

listenAdsPartTime = function () {
    let URL;
    const videoAdsDuration = Math.floor(videoTag.duration);
    const start = 0;
    const progress = window.skipAdsTime;
    const firstQuartile = Math.ceil(videoAdsDuration / 4);
    const midpoint = firstQuartile * 2;
    const thirdQuartile = firstQuartile * 3;
    const complete = videoAdsDuration;

    switch (Math.floor(videoTag.currentTime)) {
        case start:
            URL = {url: window.startURL, event: 'start'}
            break
        case progress:
            URL = {url: window.progressURL, event: 'progress'}
            break
        case firstQuartile:
            URL = {url: window.firstQuartileURL, event: 'firstQuartile'}
            break
        case midpoint:
            URL = {url: window.midpointURL, event: 'midpoint'}
            break
        case thirdQuartile:
            URL = {url: window.thirdQuartileURL, event: 'thirdQuartile'}
            break
        case complete:
            URL = {url: window.completeURL, event: 'complete'}
            break
    }
    if ((URL && URL.event === 'start' && startFired === false)) {
        startFired = true;
        callAdsTrackApi(URL.url).then(() => {
        });
    }
    if ((URL && URL.event === 'progress' && proggressFired === false)) {
        proggressFired = true;
        callAdsTrackApi(URL.url).then(() => {
        });
    }
    if ((URL && URL.event === 'firstQuartile' && firstQuartileFired === false)) {
        firstQuartileFired = true;
        callAdsTrackApi(URL.url).then(() => {
        });
    }
    if ((URL && URL.event === 'midpoint' && midpointFired === false)) {
        midpointFired = true;
        callAdsTrackApi(URL.url).then(() => {
        });
    }
    if ((URL && URL.event === 'thirdQuartile' && thirdQuartileFired === false)) {
        thirdQuartileFired = true;
        callAdsTrackApi(URL.url).then(() => {
        });
    }
    if ((URL && URL.event === 'complete' && completeFired === false)) {
        completeFired = true;
        callAdsTrackApi(URL.url).then(() => {
        });
    }
}

function showSlot(slot) {
    $(".skipBtn").show().addClass("disabled");
    videoTag.src = slot.source;
    videoTag.play();
    videoTag.addEventListener('timeupdate', listenAdsPartTime, false);
    $('.skipBtn').html(countDown);

    countDownInterval = setInterval(function () {
        $(".skipBtn").text(countDown - 1);
        if (countDown < 1) {
            $(".skipBtn").text('skip ads');
            clearInterval(countDownInterval);
        }
        countDown--;
    }, 1000);

    var intervalAd = setInterval(function () {
        if ($('#example_video_1').get(0).currentTime > skipAdsTime + 0.1) {
            $(".skipBtn").removeClass("disabled");
            clearInterval(intervalAd);
        }
    }, 1000);

    videoTag.addEventListener('ended', resumePlayBackAfterSlotShow, false);
}


function slotForCurrentTime(currentTime) {
    // for (v in AdList) {
    //     if (!AdList[v].seen) {
    //         if (AdList[v].time == currentTime) {
    //             return AdList[v];
    //         }
    //     }
    // }
    for (v in AdList) {
        if (!AdList[v].seen && AdList[v].source) {
            if (AdList[v].time == currentTime) {
                return AdList[v];
            }
        }
    }
    return null;
}

function showAdSlots() {
    var slot = slotForCurrentTime(Math.floor(videoTag.currentTime));
    if (slot) {
        slot.seen = true;
        tempTime = videoTag.currentTime;
        videoTag.removeEventListener('timeupdate', showAdSlots, false);
        showSlot(slot);
    }
}

var tempTime = 0;
var skipAdsTime = 5;
var countDownInterval;
var countDown = 5;

var startFired = false;
var proggressFired = false;
var firstQuartileFired = false;
var midpointFired = false;
var thirdQuartileFired = false;
var completeFired = false;

var adsClickLink;

var videoTag;
var AdList = new Array;
var supposedCurrentTime = 0;

var AdObj;

function initAdsFor(videoID) {
    // window.tempTime = 0;
    // window.skipAdsTime = 5;
    // window.countDownInterval;
    // window.countDown = 5;

    // window.startFired = false;
    // window.proggressFired = false;
    // window.firstQuartileFired = false;
    // window.midpointFired = false;
    // window.thirdQuartileFired = false;
    // window.completeFired = false;

    window.videoTag = document.getElementById(videoID);
    videoTag.mainTrack = videoTag.src;
    // window.AdList = new Array;
    // window.supposedCurrentTime = 0;

    AdObj = parseAdsParameters(videoTag.getAttribute('ads'));
    AdsRequest(AdObj);

    videoTag.addEventListener('play', getAdsSource, false);
    videoTag.addEventListener('pause', managePauseVideo, false);
    videoTag.addEventListener('ended', manageEndedMainVideo, false);
    videoTag.addEventListener('timeupdate', function () {
        if (!videoTag.seeking && videoTag.mainTrack !== videoTag.src) {
            supposedCurrentTime = videoTag.currentTime;
        }
    });

    videoTag.addEventListener('seeking', function (e) {
        if (videoTag.mainTrack === videoTag.src) {
            if (AdList.every(item => !item.seen)) {
                videoTag.currentTime = 0;
            }
        }
        if (videoTag.mainTrack !== videoTag.src) {
            clearInterval(countDownInterval);
            const delta = videoTag.currentTime - supposedCurrentTime;
            if (Math.abs(delta) > 0.01) {
                videoTag.currentTime = supposedCurrentTime;
                if ($('.skipBtn').text() !== 'skip ads') {
                    videoTag.addEventListener('timeupdate', resumeAdsVideo, false);
                }
            }
        }
    }, false);

    videoTag.addEventListener('seeked', function (e) {
        if (videoTag.mainTrack !== videoTag.src) {
            clearInterval(countDownInterval);
            if ($('.skipBtn').text() !== 'skip ads') {
                videoTag.addEventListener('timeupdate', resumeAdsVideo, false);
            }
        }
    }, false);
}

getAdsSource = function () {
    videoTag.removeEventListener('play', getAdsSource, false);
    videoTag.removeEventListener('timeupdate', getAdsSource, false);
    var http_request = new XMLHttpRequest();
    http_request.open("GET", AdObj.servers[0]["apiAddress"], true);
    http_request.send(null);
    http_request.onreadystatechange = function () {
        if (http_request.readyState == 4) {
            if (http_request.status == 200) {
                var xml = http_request.responseXML;
                if (xml) {
                    constructAdList(xml);
                }
            }
            http_request = null;
        }
    }
}

managePauseVideo = function () {
    if (videoTag.mainTrack !== videoTag.src) {
        if (videoTag.currentTime !== videoTag.duration) {
            if (adsClickLink) {
                window.open(adsClickLink, '_blank');
            }
        }
        clearInterval(countDownInterval);
        countDown = $('.skipBtn').text();
        if ($('.skipBtn').text() !== 'skip ads') {
            videoTag.addEventListener('timeupdate', resumeAdsVideo, false);
        }
    }
}

resumeAdsVideo = function () {
    videoTag.removeEventListener('timeupdate', resumeAdsVideo, false);
    if (countDown === 'skip ads') {
        return false;
    }
    $('.skipBtn').text(countDown);
    countDownInterval = setInterval(function () {
        $('.skipBtn').text(countDown - 1);
        if (countDown < 1) {
            $(".skipBtn").text('skip ads');
            clearInterval(countDownInterval);
        }
        countDown--;
    }, 1000)
}

manageSeekingVideo = function (event) {
    if (videoTag.mainTrack !== videoTag.src) {
        event.preventDefault();
        videoTag.removeEventListener('seeking', manageSeekingVideo, false);
        const time = videoTag.currentTime;
        videoTag.currentTime = time;
    }
}

manageEndedMainVideo = function () {
    supposedCurrentTime = 0;
    if (videoTag.mainTrack === videoTag.src) {
        AdList.forEach(item => item.seen = false);
        countDown = 5;
        // اگه بخوایم بعد از یکبار پخش تبلیغ با پخش مجدد ویدیو دیگه تبلیغ پخش نشه
        // videoTag.addEventListener('ended', manageEndedMainVideo, false);
        videoTag.addEventListener('timeupdate', getAdsSource, false);
    }
}

function setPostRollTime() {
    videoTag.removeEventListener("canplay", setPostRollTime, false);
    for (v in AdList) {
        if (AdList[v].type == "post-roll") {
            AdList[v].time = Math.floor(videoTag.duration);
        }
    }
}

$(document).on('click', '.skipBtn', function (e) {
    if ($('#example_video_1').get(0).currentTime < skipAdsTime) {
        return;
    }
    resumePlayBackAfterSlotShow()
});


