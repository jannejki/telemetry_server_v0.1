startTime();

function startTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    let ms = today.getMilliseconds();
    m = checkTime(m);
    s = checkTime(s);
    ms = checkTime(ms);
    console.log(h,":", m, ":",s,":",ms);
    setTimeout(startTime, 500);
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}