var CTKeyStatesArray = new ReactiveVar();
var animate = true;
var animId = 0;
var currentFrameNumber = 0;
var animationIsInProgress = false;
var intervalId = 0;
var imageBlobUrls = new Array();

Template.cvp_results_CameraTweeen.created = function () { }

Template.cvp_results_CameraTweeen.rendered = function () { }

Template.cvp_results_CameraTweeen.helpers({

    'flowLinesAndVector': function () {
        var url = Router.current().url;
        if(url.includes("FlowLines")||url.includes("FlowLinesWithVectors")){
            return true;
        }
        return false;
    }
});

Template.cvp_results_CameraTweeen.events({

    'click #CTaddBtn': function () {
        //$('#CTSaveImagesBtn').show();
        var keyFrames = CTKeyStatesArray.get();
        if (!keyFrames || keyFrames.length <= 0) {
            keyFrames = [];
            keyFrames.push(SHub.Globals.viewer.getState());
            CTKeyStatesArray.set(keyFrames);
        }
        else {
            keyFrames.push(SHub.Globals.viewer.getState());
            CTKeyStatesArray.set(keyFrames);
        }
        //getScreenShotBlobUrl();
    },
    'click #CTstopBtn': function () {
        clearInterval(intervalId);
        console.log("Tween stoped");
    },
    'click #CTplayBtn': function () {
        var frames = CTKeyStatesArray.get();
        intervalId = setInterval(function () {
            if (currentFrameNumber < frames.length) {
                if (animationIsInProgress == false) {
                    tweenCameraTo(frames[currentFrameNumber]);
                    currentFrameNumber++;
                }
            }
            else {
                currentFrameNumber = 0;
                //clearInterval(intervalId);
            }
        }, 100)
    },
    'click #CTclearBtn': function () {
        $('#CTSaveImagesBtn').hide();
        CTKeyStatesArray.set([]);
        currentFrameNumber = 0;
        clearInterval(intervalId);
        console.log("Cleared current camera tween");
    },
    'click #CTsaveBtn': function () {
        var CTData = encodeTweenData();
        UpdateCameraTweenData({
            'CameraTweenData': CTData,
            'DataType': "CameraTween"
        });
    },
    'click #CTSaveImagesBtn': function () {

    }
});

var tweenCameraTo = function (state) {

    animationIsInProgress = true;

    const targetEnd = new THREE.Vector3(
        state.viewport.target[0],
        state.viewport.target[1],
        state.viewport.target[2]);

    const posEnd = new THREE.Vector3(
        state.viewport.eye[0],
        state.viewport.eye[1],
        state.viewport.eye[2]);

    const upEnd = new THREE.Vector3(
        state.viewport.up[0],
        state.viewport.up[1],
        state.viewport.up[2]);

    const nav = SHub.Globals.viewer.navigation;
    const target = new THREE.Vector3().copy(nav.getTarget())

    const pos = new THREE.Vector3().copy(nav.getPosition())

    const up = new THREE.Vector3().copy(nav.getCameraUpVector())

    const targetTween = createTween({
        onUpdate: (v) => {
            nav.setTarget(v);
        },
        duration: 3000,
        object: target,
        to: targetEnd
    })

    const posTween = createTween({
        onUpdate: (v) => {
            nav.setPosition(v);
        },
        duration: 3000,
        object: pos,
        to: posEnd
    })

    const upTween = createTween({
        onUpdate: (v) => {
            nav.setCameraUpVector(v);
        },
        duration: 3000,
        object: up,
        to: upEnd
    })

    Promise.all([
        targetTween,
        posTween,
        upTween]).then(() => {

            animate = false;
            animationIsInProgress = false;
        })

    runAnimation(true)
}

var createTween = function (params) {

    return new Promise((resolve) => {
        new TWEEN.Tween(params.object)
            .to(params.to, params.duration)
            .onComplete(() => resolve())
            .onUpdate(params.onUpdate)
            .easing(TWEEN.Easing.Linear.None)
            .start();
    });
}

// starts animation
var runAnimation = function (start) {

    if (start || animate) {

        animId = window.requestAnimationFrame(
            runAnimation)

        TWEEN.update()
    }
}

Template.cvp_results_CameraTweeen.helpers({

    'keyFrameList': function () {
        var frames = CTKeyStatesArray.get();
        var dataArray = [];
        if (frames && frames.length > 0) {
            for (let i = 0; i < frames.length; i++) {
                var keyFrame = frames[i];

                dataArray.push(
                    {
                        Sr: i + 1,
                        Description: "Frame " + (i + 1),
                        ID: i
                    }
                );
            }
        }
        return dataArray;
    }
})

Template.cvp_results_CameraTweeen.destroyed = function () {
    console.log("cvp_results_CameraTweeen.destroyed() called");
}

var getScreenShotBlobUrl = function (viewer) {

    viewer = SHub.Globals.viewer;
    if (!viewer) {
        return;
    }

    var canvas = $('canvas').length > 0 ? $('canvas')[0] : null;
    if (canvas) {
        var width = $(canvas).width();
        var height = $(canvas).height();

        var renderer = viewer.impl.renderer();
        renderer.presentBuffer();
        var blobURL = window.URL.createObjectURL(dataURLToBlob(viewer.canvas.toDataURL("image/jpg")));

        imageBlobUrls.push(blobURL);
        console.log(imageBlobUrls);
    }
}

dataURLToBlob = function (dataURL) {
    var BASE64_MARKER = ';base64,';
    var parts = null;
    var contentType = null;
    var raw = null;
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        parts = dataURL.split(',');
        contentType = parts[0].split(':')[1];
        raw = decodeURIComponent(parts[1]);

        return new Blob([raw], { type: contentType });
    }

    parts = dataURL.split(BASE64_MARKER);
    contentType = parts[0].split(':')[1];
    raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
}

var UpdateCameraTweenData = function (data, onSuccess, onFailure) {
    var url = SHub.Constants.SHAPP_API_URL + "api/v3/app/project/" + Session.get('PROJECT_ID') + "/post/updatecameratweendata";

    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json",
        processData: false,
        async: false,
        headers: { "Authorization": "Bearer " + SHub.Accounts.getAccessToken() },
        data: JSON.stringify(data),
        success: function (result) {
            if (onSuccess)
                onSuccess(result);
        },
        error: function (err) {
            if (onFailure)
                onFailure(err);
        }
    });
}


Template.selectedKeyFrameRow.events({
    'click tr .material-icons:contains("delete_forever")': function (e) {
        var frames = CTKeyStatesArray.get();
        frames.splice(parseInt(e.target.parentElement.id), 1);
        imageBlobUrls.splice(parseInt(e.target.parentElement.id), 1);
        CTKeyStatesArray.set(frames);
        console.log(imageBlobUrls);
    }
});
//

var encodeTweenData = function () {
    var keyFrames = CTKeyStatesArray.get();
    var optimisedData = {};
    var viewPortDataArray = new Array();
    var commonData = {};
    var i = 0;
    commonData.seedURN = keyFrames[i].seedURN;
    commonData.cutplanes = keyFrames[i].cutplanes;
    commonData.objectSet = keyFrames[i].objectSet;
    commonData.renderOptions = keyFrames[i].renderOptions;

    for (i; i < keyFrames.length; i++) {
        viewPortDataArray.push(keyFrames[i].viewport)
    }

    optimisedData.common = commonData;
    optimisedData.viewPort = viewPortDataArray
    console.log(optimisedData);
    return optimisedData;
}



//============================================

// const targetEnd = new THREE.Vector3(
//     state.viewport.target[0],
//     state.viewport.target[1],
//     state.viewport.target[2])

//   const posEnd = new THREE.Vector3(
//     state.viewport.eye[0],
//     state.viewport.eye[1],
//     state.viewport.eye[2])

//   const upEnd = new THREE.Vector3(
//     state.viewport.up[0],
//     state.viewport.up[1],
//     state.viewport.up[2])


// const nav = SHub.Globals.viewer.navigation;

// const target = new THREE.Vector3().copy(nav.getTarget())

// const pos = new THREE.Vector3().copy(nav.getPosition())

// const up = new THREE.Vector3().copy(nav.getCameraUpVector())

// //const targetOnUpdate = nav.setTarget();
// const targetTween = createTween({
//     easing: 'Linear',
//     onUpdate: (v) => {
//         nav.setTarget(v);
//     },
//     duration: 2500,
//     object: target,
//     to: targetEnd
// })

// //const posOnUpdate = nav.setPosition();
// const posTween = createTween({
//     easing: 'Linear',
//     onUpdate: (v) => {
//         nav.setPosition(v);
//     },
//     duration: 2500,
//     object: pos,
//     to: posEnd
// })

// //const upOnUpdate = nav.setCameraUpVector();
// const upTween = createTween({
//     easing: 'Linear',
//     onUpdate: (v) => {
//         nav.setCameraUpVector(v);
//     },
//     duration: 2500,
//     object: up,
//     to: upEnd
// })

// TWEEN.update();
// Promise.all([
//     targetTween,
//     posTween,
//     upTween]).then(() => {

//         this.animate = false
//     })

// this.runAnimation(true)

//============================================
//var state = SHub.Globals.viewer.getState();
//viewerStatesArray.push(state);
//if (viewer.model) {}

// var saveCameraStates = function () {
//     viewerStatesArray.push(SHub.Globals.viewer.getState());
// }

  //     var tween = new TWEEN.Tween(position).to(target, 2000);

        //     const targetEnd = new THREE.Vector3(
        //         viwerStatesArray[0].viewport.target[0],
        //         viwerStatesArray[0].viewport.target[1],
        //         viwerStatesArray[0].viewport.target[2])

        //       const posEnd = new THREE.Vector3(
        //         viwerStatesArray[0].viewport.eye[0],
        //         viwerStatesArray[0].viewport.eye[1],
        //         viwerStatesArray[0].viewport.eye[2])

        //       const upEnd = new THREE.Vector3(
        //         viwerStatesArray[0].viewport.up[0],
        //         viwerStatesArray[0].viewport.up[1],
        //         viwerStatesArray[0].viewport.up[2])

        //         const nav = this.navigation

        // const target = new THREE.Vector3().copy(
        //   nav.getTarget())

        // const pos = new THREE.Vector3().copy(
        //   nav.getPosition())

        // const up = new THREE.Vector3().copy(
        //   nav.getCameraUpVector())

        //     var targetTween = new createTween({
        //         easing: targetTweenEasing.id,
        //         onUpdate: (v) => {
        //           nav.setTarget(v)
        //         },
        //         duration: targetTweenDuration,
        //         object: target,
        //         to: targetEnd
        //       })
        // viwerStatesArray.forEach(element => {
        //     window.setTimeout(()=>  {
        //         SHub.Globals.viewer.restoreState(element, null, true);
        //     }, 5000)

        // });
        // var i = 0
        // for (i; i < viwerStatesArray.length; i++) {
        //     window.setTimeout(() => {
        //         i++
        //         SHub.Globals.viewer.restoreState(viwerStatesArray[i], null, true);
        //     }, 100)
        // }



        // Template.cvp_results_CameraTweeen.UpdateModelOpacity = function (currentOpacity) {
//     var materialManager = SHub.Globals.AppFactory().MaterialManager();
//     var selectedOnly = $("#selectedonly").is(':checked');
//     materialManager.UpdateModelOpacity(currentOpacity, selectedOnly);
// }

// tween = new TWEEN.Tween(position)
// 					.to({x: 700, y: 200, rotation: 359}, 2000)
// 					.delay(1000)
// 					.easing(TWEEN.Easing.Elastic.InOut)
// 					.onUpdate(update);

// var tweenCameraTo (state) = function (){

//     // tween parameters, specific to my app but easy
//     // to adapt ...
//     const {

//       targetTweenDuration,
//       posTweenDuration,
//       upTweenDuration,

//       targetTweenEasing,
//       posTweenEasing,
//       upTweenEasing

//     }}