// Project Villa (KEF Prototype 28th Jan 2018)
var selection = null;
var textureNames = [];
// = ['lego', 'bedsheet', 'floral', 'arrow', 
//                     'bricks', 'tiles', 'designer_wood', 'rough_wood', 
//                     'wood', 'wooden_floor', 'wood_red_birch', 'white_bump_paint',
//                     'white_bump_tile', 'blue_tile', 'gravel',
//                     'pavement', 'rock_pavement', 'blue_wooven',
//                     'green_fabric', 'red_jute'
//                     ];
var currentTextureImg = 'lego';
var texture_classes = [];
var current_texture_class = "";
var lastSelectedElementIds = [];

function onImageSelection(img_selected) {
    // Make the non selected images normal
    var all_images = $("#textureList").children();
    for(var i=0; i < all_images.length; i++){
        all_images[i].height = "100";
        all_images[i].width = "100";
    };

    // Make the selected image big
    img_selected.height = "125";
    img_selected.width = "125";

    // Change the texture source.
    currentTextureImg = img_selected.id;

    // Custom Selection of Forge Viewer On
    NOP_VIEWER.addEventListener(
    Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
    onAggregateSelectionChanged);
}

function loadTextureOfAType(btn_clicked){
    if(texture_classes.includes(btn_clicked.id)){

        current_texture_class = btn_clicked.id;
        // First clean the existing texture images.
        $("#textureList").empty();

        texture_classes[btn_clicked.id].forEach(img_file_path => {
            var fileNameWOExtension = img_file_path.slice(img_file_path.lastIndexOf('/')+1, img_file_path.lastIndexOf('.'))
            var img_html = "<img src='{0}' id='{1}' alt='{2}' width='100' height='100' hspace='2' vspace='2' onclick='onImageSelection(this);'>".format(img_file_path, fileNameWOExtension, fileNameWOExtension);
            $("#textureList").append(img_html);
        });

        // Remove the viewer selection callback. Add it again on image selection.
        NOP_VIEWER.removeEventListener(
        Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
        onAggregateSelectionChanged);
    }
}

// String formatting function
String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};

var enableTextures = function(){
    var parentDir = "./Resource/materials/";

    var fileCrowler = function(data){
        var titlestr = $(data).filter('title').text();
        // "Directory listing for /Resource/materials/fabric/"
        var thisDirectory = titlestr.slice(titlestr.indexOf('/'), titlestr.length)
        var directory_strings = thisDirectory.split('/');
        var DirectoryNameOnly = directory_strings[directory_strings.length-2];            


        //List all image file names in the page
        $(data).find("a").attr("href", function (i, filename) {
            if( filename.match(/\.(jpe?g|png|gif)$/) ) { 
                var fileNameWOExtension = filename.slice(0, filename.lastIndexOf('.'))                   
                textureNames.push(fileNameWOExtension);

                // if it's a new texture class, put a button for it.
                if(!texture_classes.includes(DirectoryNameOnly)){
                    texture_classes.push(DirectoryNameOnly);
                    // add a button for it
                    // we have got the name of a folder, might as well create a separate category
                    btn_html = "<button style='margin-right: 2px' class='btn btn-info' type='button' id={0} onclick='loadTextureOfAType(this)'><i class='fa fa-video-camera'></i>&nbsp;&nbsp;<span class='bold'>{1}</span></button>".format(DirectoryNameOnly, DirectoryNameOnly);
                    $("#texture_class_buttons").append(btn_html);

                    texture_classes[DirectoryNameOnly] = [];
                }

                if(!texture_classes[DirectoryNameOnly].includes(thisDirectory + filename)){
                    texture_classes[DirectoryNameOnly].push(thisDirectory + filename);
                }
            }
            else{ 
                $.ajax({
                    //This will retrieve the contents of the folder if the folder is configured as 'browsable'
                    url: thisDirectory + filename,
                    success: fileCrowler
                });
            }
        });
    }

    $.ajax({
        //This will retrieve the contents of the folder if the folder is configured as 'browsable'
        url: parentDir,
        success: fileCrowler
    });
}

function onAggregateSelectionChanged(event) {

    if (event.selections && event.selections.length) {
        console.log("Inside selection change - Ashish")

        selection = event.selections[0];
        lastSelectedElementIds = selection.dbIdArray;
        var fragIds = selection.fragIdsArray; // Only works with single model. So no use.
        oViewer.selectedModelId = selection.model.id;
        //set color to red
        oViewer.setColorMaterial(lastSelectedElementIds, applyCurrentSelectedTexture);  

    }
}

function applyCurrentSelectedTexture(renderProxy){
    // get the currently selected image and use its source.
    var img = document.getElementById(currentTextureImg);            
    if(img != null){
        var texture = THREE.ImageUtils.loadTexture( img.src );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 0.1, 0.1);
        texture.minFilter = THREE.LinearFilter;
        renderProxy.material.map = texture; 
        renderProxy.material.needsUpdate = true;
    }
}

// https://forge.autodesk.com/cloud_and_mobile/2015/12/change-color-of-elements-with-view-and-data-api.html
// Ashish
var getSelectedFrags = function (selectedDbId, selectionData) {
    // Get list of all fragments in the scene.
    let allModels = oViewer.impl.modelQueue().getModels();
    let frags;
    selectionData.selectedFrags = [];

    for (let ii = 0; ii < allModels.length; ii++) {
        if (oViewer.selectedModelId != allModels[ii].id)
            continue;
        selectionData.fraglist = allModels[ii].getFragmentList();
        frags = selectionData.fraglist.fragments;

        // Get the Fragments that are involved with selected component.
        // selectionData.selectedFrags = frags.dbId2fragId[selectedDbId];
        for(var k = 0; k < frags.length; k++){ 
            if(frags.fragId2dbId[k] == selectedDbId){
                selectionData.selectedFrags.push(k)
            }
        }

        if (selectionData.selectedFrags) {
            break;
        }
    }

    // sometimes frags.dbId2fragId returns only a number.
    if (frags && (selectionData.selectedFrags == undefined || selectionData.selectedFrags.length == undefined)) {
        selectionData.selectedFrags = [];
        selectionData.selectedFrags.push(frags.dbId2fragId[selectedDbId]);
    }
}

///////////////////////////////////////////////////////////////////////////
// Set color for nodes
// objectIds should be an array of dbId
// 
//
///////////////////////////////////////////////////////////////////////////
Autodesk.Viewing.Viewer3D.prototype.setColorMaterial = function(objectIds, whatToDo) {

    for (var i=0; i<objectIds.length; i++) {

        var dbid = objectIds[i];

         // DbId of selected component. 1 DbID => 1 Component.
        let selectionData = { selectedFrags: null, fraglist: null }; // to pass by reference.

        getSelectedFrags(dbid, selectionData);

        if (selectionData.selectedFrags == null || selectionData.selectedFrags == undefined)
            return;

        // A fragment can contain many geometries from different components.
        // We need only those geometries which belong to selected DbId.
        for (let j = 0; j < selectionData.selectedFrags.length; j++) {
            var fragId = selectionData.selectedFrags[j]
            var renderProxy = oViewer.impl.getRenderProxy(selection.model, fragId);

            whatToDo(renderProxy);

            oViewer.clearSelection();
            oViewer.impl.invalidate(true);
        }
    }
}

// This gets triggered when we change the type of texel density
function TexelSettingChanged(sel){
    // alert("Selection Changed to " + sel.value);
    const agSel = oViewer.getAggregateSelection();
    if(agSel.length != 0 && agSel[0].selection != undefined){
        selection = agSel[0];
        lastSelectedElementIds = agSel[0].selection;
        oViewer.selectedModelId = agSel[0].model.id;
    }

    if(lastSelectedElementIds.length == 0)
        alert("Select Something first.")

    oViewer.setColorMaterial(lastSelectedElementIds, changeTexelDensity)
}

// this function changes the texture density on the last selected element (stored in global variable)
function changeTexelDensity(renderProxy){
    var txlSelect = document.getElementById("texelSelect");

    if(renderProxy.material.map == undefined || renderProxy.material.map == undefined){
        alert("There is mo texture on the last selection. Select something with texture.");
        return;
    }
    if(txlSelect.value == 'sparse'){
        renderProxy.material.map.repeat.set( 0.1, 0.1);
    }
    else if(txlSelect.value == 'medium'){
        renderProxy.material.map.repeat.set( 0.25, 0.25);
    }
    else if(txlSelect.value == 'dense'){
        renderProxy.material.map.repeat.set( 0.5, 0.5);
    }
}

// *******************************************
// My Awesome (Docking) Panel
// *******************************************
function MyAwesomePanel(viewer, container, id, title, options) {
    this.viewer = viewer;
    Autodesk.Viewing.UI.DockingPanel.call(this, container, id, title, options);

    // the style of the docking panel
    // use this built-in style to support Themes on Viewer 4+
    this.container.classList.add('docking-panel-container-solid-color-a');
    this.container.style.top = "10px";
    this.container.style.left = "10px";
    this.container.style.width = "auto";
    this.container.style.height = "auto";
    this.container.style.resize = "auto";

    // this is where we should place the content of our panel
    var div = document.getElementById("TexelSelectDiv")
    if(div == null){
        div = document.createElement('div');
        div.id = "TexelSelectDiv";
        div.style.margin = '20px';
        div.innerText = "Texel Density  ";

        var html = [
        "<select style='color:grey;' id='texelSelect' onchange='TexelSettingChanged(this)'>",
        "<option value='sparse'>sparse</option>",
        "<option value='medium'>medium</option>",
        "<option value='dense'>dense</option>",
        "</select>"
        ].join('\n')
        $(div).append(html);
    }
    
    this.container.appendChild(div);
    // and may also append child elements...        

   // With JQuery
    $("#ex9").slider({
        precision: 2,
        value: 8.115 // Slider will instantiate showing 8.12 due to specified precision
    });
}