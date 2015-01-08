var processingMessage = false;
var canSend           = false;
//synchronize with other devices? (can be switched in menuToolbar.js)
var isSynchronized    = true;

///interval between two synchronization msgs in ms
var sendInterval = 700;

var lastTimestamp;

var lastData;

var x3dRoot;

function initializeModelViewer() {
  x3dRoot     = document.getElementById('viewer_object');
  x3dViewport = document.getElementById('viewport');

  // Normalize scene camera to view all content.
  normalizeCamera(x3dRoot.runtime);

  // Add listeners for publishing local changes.
  x3dViewport.addEventListener('viewpointChanged', viewpointChanged);

  // !!!HACK!!! to prevent propagating initial position when new user connected.
  x3dRoot.addEventListener('mousedown', function() {
    canSend = true;
    x3dRoot.removeEventListener('mousedown', arguments.callee);
    log('Enabled publishing!');
  });
  x3dRoot.addEventListener('touchstart', function() {
    canSend = true;
    x3dRoot.removeEventListener('touchstart', arguments.callee);
    log('Enabled publishing!');
  });
}
function onRemoteUpdate(extras) {
  // Don't synchronize if the viewpoint is from another model
  if(extras.selectedModel != window.location.search){
    return;
  }

  var newTimestamp = new Date(extras.timestamp);

  // Synchronization is stopped
  if(!isSynchronized) {
    // Save the timestamp, position and rotation data.
    if(lastTimestamp == null || newTimestamp > lastTimestamp) {
      lastData = extras;
    }
    return;
  }

  // Prevent async local and remote updates.
  processingMessage = true;

  // Update only if received timestamp is greater than last timestamp.
  if(lastTimestamp == null || newTimestamp > lastTimestamp) {
    //disable sending position updates until we receive no more update
    canSend = false;
      
    setView(x3dRoot.runtime, extras, finishedSettingView);
    lastTimestamp = newTimestamp;
  }

  // Re-enable async local and remote updates.
  processingMessage = false;
}
subscribeIWC("ViewpointUpdate", onRemoteUpdate);

function onLocalUpdate() {
  if(!isEmbeddedInRole || !isSynchronized || processingMessage || !canSend) {
    return;
  }

  // Setup the data to be sent to others.
  var data = getView(x3dRoot.runtime);
  data["timestamp"] = new Date();
  lastTimestamp = data["timestamp"];

  //also specifiy what model was moved (included in uri)
  data.selectedModel = window.location.search;

  publishIWC("ViewpointUpdate", data);
  log('Published message!');
}

/**
 * On a change of the viewpoint we might want to start the synchronization
 * with the other widgets.
 * @param evt viewpoint changed event
 */
function viewpointChanged(evt) {    

  // Prevent widgets from sending updates while applying a received viewpoint msg
  // If we set the position because we received a message we do not want to send it back
  if(!evt || processingMessage || !canSend) {
    log("Bypassing send!" + processingMessage + canSend);
    
    return;
  }

  //enable sending the position in a loop
  if(typeof updateInterval != 'number'){ //but only when its not already enabled
    updateInterval = setInterval(onLocalUpdate, sendInterval);
    log("sending");
  }

  //disable sending the positions a bit after the last update
  if(typeof sendTimeout != 'undefined'){
    clearTimeout(sendTimeout);
  }
  sendTimeout = setTimeout(function(){ 
    //disable sending
    clearTimeout(updateInterval);
    updateInterval = null;
    log("Not sending anymore");
  } , sendInterval + 50);
}


function log(message) {
  document.getElementById('debugText').innerHTML =
  (new Date()).toLocaleTimeString() + ' - ' + message;
}

/**
 * An overview widget selected a model, we load it
 *
 * Ali: Is this used by other JS files? If so, mark it in
 * the JSDoc!!!
 */
function receiveModelSelectedByOverview(msgContent){
  window.location.assign(msgContent);
}

/**
 * Re-synchronize with last location sent from other widgetsü
 *
 * Ali: Is this used by other JS files? If so, mark it in
 * the JSDoc!!!
 */
function synchronizePositionAndOrientation() {
  if(lastData != null) {
    setView(x3dRoot.runtime, lastData);
  }
}

/**
 * Callback function for the setView function,
 * so we get notified when the interpolation is finished.
 */
function finishedSettingView(){
  //reenable sending position updates
  if(typeof enableSendingTimeout != 'undefined'){
    clearTimeout(enableSendingTimeout);
  }
  enableSendingTimeout = setTimeout(function(){ 
    //disable sending
    canSend = true; 
    log("finished updating");
  } , 50);
}
