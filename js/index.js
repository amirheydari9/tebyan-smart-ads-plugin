let myplayers = document.querySelectorAll(".myplayer");
let lastVal;

myplayers.forEach(function (myplayer) {
    let controlsHtml = `
    <div class="controls__progressbar">
        <input class="controls__progressbar-current" type="range" min="1" max="100" step="1" value="0" />
        <div class="seek-tooltip" id="seek-tooltip">00:00</div>
    </div>
    <div class="controls__btns">
        <div class="left">
            <div class="btns play">
                <img src="./img/play.svg" alt=""/>
            </div>
            <div class=" pause">
                <img src="./img/pause.svg" alt=""/>
            </div>
            <div class="btns rewind">
                <img src="./img/rewind.svg" alt=""/>
            </div>
            <div class="btns forward">
                <img src="./img/fast-forward.svg" alt=""/>
            </div>
            <div class="btns volume">
                <img src="./img/volume.svg" alt="" class="volume_icon ">
                <img src="./img/mute1.svg" alt="" class=" mute">
                <div class="volume__progress ml-2">
                    <input id="volume_bar" type="range" min="1" max="100" step="1" value = "50" />
                </div>
            </div>
            <div class="timer">
                <span class="currentTime">00:00</span>
                <span>/</span>
                <span class="videoTime" >00:00</span>
            </div>
        </div>
        <div class="right">
            <div class=" btns pic">
                <img src="./img/Pic_in_pic.svg" alt=""/>
            </div>
            <div class="btns setting">
                <img src="./img/Setting.svg" alt=""/>
            </div>
            <div class="btns theater">
                <img src="./img/Wide.svg" alt=""/>
            </div>
            <div class="btns fullscreen">
                <img class="icon" src="./img/Fullscreen.svg" alt=""/>
            </div>
        </div>
        <ul class="speed">
            <li class="speed_rate_item"  onclick={changeSpeed(this,2)}>2X</li>
            <li class="speed_rate_item" onclick={changeSpeed(this,1.5)} >1.5X</li>
            <li class="active speed_rate_item" onclick={changeSpeed(this,1)} >1X</li>
            <li class="speed_rate_item" onclick={changeSpeed(this,0.5)}>0.5X</li>
        </ul>
    </div>`;

    //*******************/ add controls element btn 
    let div = document.createElement('div');
    div.innerHTML = controlsHtml;
    div.classList.add("myplayer__controls");
    myplayer.appendChild(div);


    let controls = myplayer.querySelector(".myplayer__controls");
    let media = myplayer.querySelector("video");
    let play = controls.querySelector(".play");
    let pause = controls.querySelector(".pause");
    let rwd = controls.querySelector(".rewind");
    let fwd = controls.querySelector(".forward");
    let timer = controls.querySelector(".timer");
    let current_time = timer.querySelector(".currentTime");
    let video_time = timer.querySelector(".videoTime");
    let input = controls.querySelector(".controls__progressbar-current");
    let volume = controls.querySelector(".volume");
    let volume_icon = volume.querySelector(".volume_icon");
    let mute_icon = volume.querySelector(".mute");
    let volume_progress = volume.querySelector(".volume__progress");
    let input_volume = volume_progress.querySelector("input");
    let fullscreen_icon = controls.querySelector(".fullscreen .icon");
    let setting = document.querySelector(".setting");
    let controls__progressbar = document.querySelector(".controls__progressbar");
    let progress_input = controls__progressbar.querySelector("input");
    let seek_tooltip = myplayer.querySelector(".seek-tooltip");
    let progressColor = "rgba(255, 186, 0, 1)";


    // ********************add tooltip

    function formatTime(timeInSeconds) {
        const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);
        return {
            minutes: result.substr(3, 2),
            seconds: result.substr(6, 2)
        };
    }

    seek_tooltip.style.display = "none";

    function updateSeekTooltip(event) {
        const skipTo = Math.round((event.offsetX / event.target.clientWidth) * parseInt(event.target.getAttribute('max'), 10));
        let skipTo_second = Math.floor((+skipTo / 100) * +media.duration);
        progress_input.setAttribute('data-seek', skipTo_second);
        const t = formatTime(skipTo_second);
        seek_tooltip.style.display = "flex";
        seek_tooltip.textContent = `${t.minutes}:${t.seconds}`;
        const rect = media.getBoundingClientRect();
        seek_tooltip.style.left = `${event.pageX - rect.left - 12}px`;
        seek_tooltip.style.left < 0 + "px" ? seek_tooltip.style.left = 0 + "px" : seek_tooltip.style.left > 882 + "px" ? seek_tooltip.style.left = 882 + "px" : "";
    }

    progress_input.addEventListener("mousemove", updateSeekTooltip);
    progress_input.addEventListener("mouseleave", function () {
        seek_tooltip.style.display = "none";
    });

    function playanimation() {
        media.play();
        pause.style.display = "flex";
        play.style.display = "none";
        animatedBtn.classList.remove("animationsTow");
        animatedBtn.classList.toggle("animations");
        animatedBtn.innerHTML = "";
        animatedBtn.innerHTML = `<img src="./img/play.svg" alt="play">`;
    }

    function pauseanimation() {
        media.pause();
        pause.style.display = "none";
        play.style.display = "flex";
        animatedBtn.classList.toggle("animations");
        animatedBtn.classList.add("animationsTow");
        animatedBtn.innerHTML = "";
        animatedBtn.innerHTML = `<img src="./img/pause.svg" alt="pause">`;
    }

    let animatedBtn = document.createElement("div");
    animatedBtn.classList.add("animated_btns");
    media.insertAdjacentElement("afterend", animatedBtn);
    animatedBtn.style.display = "none";

    animatedBtn.addEventListener("click", function () {
        if (!animatedBtn.classList.contains("animations")) {
            video_time.textContent = gettime(media.duration);
            playanimation();
            animatedBtn.style.display = "flex";
        } else {
            pauseanimation();
            animatedBtn.style.display = "flex";
        }
    })

    media.volume = 0.5;
    play.addEventListener("click", function () {
        video_time.textContent = gettime(media.duration);
        if (media.paused) {
            playanimation();
            animatedBtn.style.display = "flex";
        } else {
            media.pause();
            play.style.display = "flex";
            pause.style.display = "none";
        }
    });
    pause.addEventListener("click", function () {
        video_time.textContent = gettime(media.duration);
        if (media.played) {
            pauseanimation();
            animatedBtn.style.display = "flex";
        } else {
            media.play();
            pause.style.display = "flex";
            play.style.display = "none";
        }
    });

    rwd.addEventListener("click", function () {
        media.currentTime = media.currentTime - 10;
    });

    fwd.addEventListener("click", function () {
        media.currentTime = media.currentTime + 10;
    });

    media.addEventListener("timeupdate", progressRange);

    function progressRange() {
        current_time.textContent = gettime(media.currentTime);
        let barlength = (media.currentTime / media.duration) * 100;
        input.style.background = `linear-gradient(90deg, ${progressColor} ${barlength}%, #000000E6 0%)`;
    }

    media.addEventListener("click", function () {
        video_time.textContent = gettime(media.duration);
        if (media.paused) {
            playanimation();
            animatedBtn.style.display = "flex";

        } else {
            pauseanimation();
            animatedBtn.style.display = "flex";
        }

    });

    input.addEventListener("input", function () {
        media.currentTime = (this.value / 100) * media.duration;
    });

    input_volume.addEventListener("input", inputVolume);

    function inputVolume() {
        mute_icon.style.display = "none";
        volume_icon.style.display = "flex";
        input_volume.setAttribute('value', `${this.value}`);
        media.volume = this.value / 100;
        input_volume.style.background = `linear-gradient(90deg,${progressColor} ${this.value}%, #FFFFFF33 0%)`;
    }

    volume_icon.addEventListener("click", function () {
        input_volume.classList.toggle("fadeInLeft");
        input_volume.style.display = "none";
        mute_icon.style.display = "flex";
        volume_icon.style.display = "none";
        input_volume.style.background = `linear-gradient(90deg, ${progressColor} 1% , rgba(255, 255, 255, 0.2) 0%)`;
        lastVal = input_volume.getAttribute("value");
        input_volume.setAttribute("value", "0");
        media.volume = 0;
    });


    mute_icon.addEventListener("click", function () {
        input_volume.style.display = "flex"
        volume_icon.style.display = "flex";
        mute_icon.style.display = "none";
        input_volume.style.background = `linear-gradient(90deg, ${progressColor}  ${lastVal}% , #FFFFFF33 0%)`;
        input_volume.setAttribute("value", `${lastVal}`);
        media.volume = lastVal / 100;
    });

    fullscreen_icon.addEventListener("click", function () {
        if (!document.fullscreenElement) {
            myplayer.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    function gettime(time) {
        let minutes = Math.floor(time / 60);
        let seconds = Math.floor(time - (minutes * 60));
        if (minutes < 10) {
            minutes = "0" + minutes;
        } else {
            minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        } else {
            seconds;
        }
        return minutes + ":" + seconds;
    }


    //**********************add theater mode 

    let video_theater = document.querySelector("#video-threater");
    let default_palyer = document.querySelector("#default-palyer");
    let theater = document.querySelector(".theater");
    let toggleThreat = false;


    theater.onclick = function () {
        toggleThreat = !toggleThreat;

        if (toggleThreat) {
            video_theater.appendChild(default_palyer.lastElementChild);
            default_palyer.innerHTML = '';
            return;
        }

        default_palyer.appendChild(video_theater.lastElementChild);
        video_theater.innerHTML = '';
    };


    // **********************advertise-functions 

    let showADV = false;
    let proggress = document.querySelector(".controls__progressbar");

    function showAdvertise() {
        showADV = true;
        if (showADV) {
            rwd.style.display = "none";
            fwd.style.display = "none";
            setting.style.display = "none";
            input.style.display = "none";
        }
        let divADv = document.createElement("div");
        divADv.classList.add("controls__progressbar-current-ADV");
        proggress.append(divADv);

        media.addEventListener("timeupdate", function () {
            current_time.textContent = gettime(media.currentTime);
            let barlength = (media.currentTime / media.duration) * 100;
            divADv.style.background = `linear-gradient(90deg, rgba(0, 206,209, 1) ${barlength}%, #000000E6 0%)`;

        });
    }

    // showAdvertise()


    // ********************ended methods 
    media.addEventListener("ended", function () {
        media.currentTime = 0;
        play.style.display = "flex";
        pause.style.display = "none";
    });

    // *********************handle pic in pic section 

    let pic = document.querySelector(".pic");
    if ('pictureInPictureEnabled' in document) {
        pic.addEventListener('click', function () {
            palyer.requestPictureInPicture().catch(error => console.log(error));
        })
    } else {
        pic.style.display = "none";
    }

});

//*********************add speed section 

document.querySelector("body").addEventListener("click", function () {
    if (speed.style.display === "flex") {
        speed.style.display = "none";
    }
});
let setting = document.querySelector(".setting");
let speed = document.querySelector(".speed");
setting.addEventListener("click", function (e) {
    if (speed.style.display === "flex") {
        speed.style.display = "none";
    } else {
        speed.style.display = "flex";
        e.stopPropagation();
    }
});
let palyer = document.querySelector("#player");

function changeSpeed(el, int) {
    palyer.playbackRate = int;
    Array.from(document.getElementsByClassName("speed_rate_item")).forEach(item => {
        item.classList.remove("active");
    });
    el.classList.add("active");
}

palyer.addEventListener("mouseenter", function () {

    speed.style.display = "none";
});









