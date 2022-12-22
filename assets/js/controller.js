const PLAYLIST_CANCIONES = "CANCIONES";
const PLAYLIST_OTRAS = "OTRAS";

function checkPlaylist() {
    $.get('/xScheduleQuery?Query=GetQueuedSteps', function(data) {
        if (data.steps.length == 0)
            $.get("/xScheduleQuery?Query=GetPlayListSteps&Parameters=" + PLAYLIST_CANCIONES, function(data2){
                let r = Math.floor(Math.random() * data2.steps.length);
                $.get("/xScheduleCommand?Command=Enqueue playlist step&Parameters=" + PLAYLIST_CANCIONES + "," + data2.steps[r].name);                
            });
    });
}

setInterval(checkPlaylist, 30000);

function addMiddleShow() {
    let ahora = new Date();
    if (ahora.getHours() < 18 || (ahora.getHours() == 23 && ahora.getMinutes() > 30))
    {
        return;
    }
    $.get("/xScheduleQuery?Query=GetPlayListSteps&Parameters=" + PLAYLIST_OTRAS, function(data){
        let r = Math.floor(Math.random() * data.steps.length);
        let url = "/xScheduleCommand?Command=Enqueue playlist step&Parameters=" + PLAYLIST_OTRAS + "," + data.steps[r].name;
        $.get(url);
    });
}

setInterval(addMiddleShow, 30 /*minutos*/ *60000);