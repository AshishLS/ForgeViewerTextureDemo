var viewerStatesArray = new Array();
var startTween;
var stateIndex = 0;
var recordIntervalTime = 20; // miliseconds


var addBtn= function () {
        // $('#playBtn').removeClass('btn-material-accent').addClass('btn-material-disabled');
        // $('#clearBtn').removeClass('btn-material-accent').addClass('btn-material-disabled');
        // $('#stopBtn').removeClass('btn-material-disabled').addClass('btn-material-accent');
        startTween = window.setInterval(() => { viewerStatesArray.push(oViewer.getState()) }, recordIntervalTime)
    }
    
var playBtn= function () {
        // $('#addBtn').removeClass('btn-material-accent').addClass('btn-material-disabled');
        // $('#clearBtn').removeClass('btn-material-accent').addClass('btn-material-disabled');
        showTween();
        stateIndex = 0;
    }

var stopBtn= function () {
        // $('#playBtn').removeClass('btn-material-disabled').addClass('btn-material-accent');
        // $('#clearBtn').removeClass('btn-material-disabled').addClass('btn-material-accent');
        console.log(viewerStatesArray);
        window.clearInterval(startTween);
    }

var clearBtn= function () {
        viewerStatesArray = [];
        //updateInitialUI();
        console.log("Cleared current walkthrough");
    }

var showTween = function () {
    setTimeout(function () {
        oViewer.restoreState(viewerStatesArray[stateIndex], null, true);
        stateIndex++;
        if (stateIndex < viewerStatesArray.length) {
            showTween();
        }
    }, recordIntervalTime)
}

var updateInitialUI = function(){
    $('#playBtn').removeClass('btn-material-accent').addClass('btn-material-disabled');
    $('#clearBtn').removeClass('btn-material-accent').addClass('btn-material-disabled');
    $('#stopBtn').removeClass('btn-material-accent').addClass('btn-material-disabled');
}

