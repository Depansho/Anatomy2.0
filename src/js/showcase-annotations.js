/**
 * Copyright 2015 Adam Brunnmeier, Dominik Studer, Alexandra Wörner, Frederik Zwilling, Ali Demiralp, Dev Sharma, Luca Liehner, Marco Dung, Georgios Toubekis
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @file showcase.js
 * Shows annotations in showcase.php
 *
 * Requires: annotations.js
 */

/** ****************************************************************************
 * This object provides functionality for all features directly related to the model
 * viewer content (note, that toolbar features are handled in toolbar.js)
 *
 * @type Object
 * ****************************************************************************/
showcase.annotater = {};

// The id of the model object as stored in Sevianno service (can be retrieved from our database)
showcase.annotater.seviannoObjectId = '';

// The Sevianno object id of the annotation whose content box is currently visible (the last annotation that has been clicked)
showcase.annotater.selectedAnnotationId = undefined;

// A list of all annotations which are related to the current model
showcase.annotater.annotations = {};

// Model viewer uses local ids for annotations which do not yet have a Sevianno id
// Stores the next free local id
showcase.annotater.nextLocalId = 0;

// must be overwritten!
// is currently done in showcase-annotations-connector.js
showcase.annotater.connector = {
    createAnnotation : function () {console.error('createAnnotation not implemented!')},
    readAnnotations : function () {console.error('readAnnotations not implemented!')},
    updateAnnotation : function () {console.error('updateAnnotation not implemented!')},
    deleteAnnotation : function () {console.error('deleteAnnotation not implemented!')}
}

/**
 * Shows an annotation marker and stores a new annotation in Sevianno service
 *
 * @param {x3dom.fields.SFVec3f} pos 3D position where to create the annotation marker
 * @param {x3dom.fields.SFVec3f} norm 3D direction where the annotation marker should point to
 * @returns {undefined}
 */
showcase.annotater.createAnnotation = function(pos, norm) {

  var username = personality.getCurrentUsername();
  // Generate a local ID to be able to reference the object until a Sevianno ID
  // has been received
  var localId = showcase.annotater.getNextLocalId();
  // Show the new annotation to the user
  showcase.annotater.markers.showAnnotationMarker(pos, norm, localId, username);

  // Store the annotation persistently with Sevianno
  showcase.annotater.connector.createAnnotation(showcase.annotater.seviannoObjectId, pos, norm, localId, username, function(answer) {
    var annotation = JSON.parse(answer);
    var localId = annotation.annotationData.localId;
    // If "Loading" div of content box is shown, move to the edit div. The edit div
    // is chosen, because the user just created an annotation (when this function is called)
    // and therefore there is no content to read, but the user most likely wants to edit
    if (!$('#div-annotation-content-loading').hasClass('hidden')) {
      showcase.annotater.contentBox.switchMode('edit');
    }
    // The currently selected annotation id is the local id of the created annotation,
    // update the selected annotation id to the Sevianno annotation id
    if (localId === showcase.annotater.selectedAnnotationId) {
      showcase.annotater.selectedAnnotationId = annotation.id;
    }
    // Each shape (annotation marker) stores its annotation id with it. We have
    // to update this id from local id to the Sevianno id. Also update the references
    // in annotation markers list and annotation list
    var transform = showcase.annotater.markers.elements[localId];
    if (transform !== undefined) {
      transform.children[0].dataset.id = annotation.id;
      showcase.annotater.markers.elements[annotation.id] = transform;
      showcase.annotater.markers.elements[localId] = undefined;

      showcase.annotater.storeAnnotationLocally(annotation);
      showcase.annotater.annotations[localId] = undefined;
    }
  });
};

/**
 * Handler for the "Save" button in the annotation content box
 * @returns {undefined}
 */
showcase.annotater.updateAnnotation = function() {
  // Read user input
  var title = $('#input-annotation-title').val();
  var content = $('#textarea-annotation-content').val();
  // Indicate that the data is being processed by showing a loading indicator
  $('#ajax-loader-edit').removeClass('hidden');

  var username = personality.getCurrentUsername();
  // Save the annotations with Sevianno
  showcase.annotater.connector.updateAnnotation(showcase.annotater.selectedAnnotationId, title, content, username, function(data) {
    // Update the local annotation stored in showcase.annotater
    var annotation = JSON.parse(data);
    showcase.annotater.storeAnnotationLocally(annotation);
    // Hide the loading indicator
    $('#ajax-loader-edit').addClass('hidden');
    // Switch to div-annotation-content-read and update its content
    showcase.annotater.contentBox.switchMode('read');
    showcase.annotater.contentBox.showContent();
  });
};

/**
 * Handler for the delete button in the annotation content box
 * @returns {undefined}
 */
showcase.annotater.deleteAnnotation = function() {
  // Get the id of the currently selected annotation (which should be deleted)
  var annotationId = showcase.annotater.annotations[showcase.annotater.selectedAnnotationId].id;

  // Indicate that deletion is in progress (by showing a loading indicator)
  $('#ajax-loader-read').removeClass('hidden');
  // Remove the annotation from Sevianno service storage
  showcase.annotater.connector.deleteAnnotation(annotationId, function() {

    // When successful, remove annotation marker (cone shape) from viewer
    // The cone shape is included in a transformation node
    var markers = document.getElementById('annotation-markers');
    var transformNode = showcase.annotater.markers.elements[annotationId];
    markers.removeChild(transformNode);
    // Hide annotation content box
    showcase.annotater.contentBox.hide();
    // Hide the loading indicator
    $('#ajax-loader-read').addClass('hidden');
  });
};

/**
 * Stores an annotation in the showcase.annotater.annotations object. It can be accessed
 * as an attribute via its annotation id. E.g. as showcase.annotater.annotations['12365']
 * @param {Object} annotation The annotation to be stored (one should typically
 * store them in the format received from Sevianno)
 * @returns {undefined}
 */
showcase.annotater.storeAnnotationLocally = function(annotation) {
  showcase.annotater.annotations[annotation.id] = annotation;
};

/**
 * Model viewer typically uses Sevianno ids to reference models (because they can
 * directly be used to do CRUD with Sevianno). But when creating an annotation,
 * no annotation id is known until the Sevianno service responds. For this timespan,
 * model viewer uses local ids.
 *
 * Note, that model viewer will replace the reference when Sevianno service responds with new id.
 *
 * @returns {String} The local annotation id
 */
showcase.annotater.getNextLocalId = function() {
  var id = 'MODEL_VIEWER' + showcase.annotater.nextLocalId;
  showcase.annotater.nextLocalId += 1;
  return id;
};

/**
 * Displays the provided annotation marker with the appearance of a 'selected' annotation marker.
 * Makes all other annotation markers look as usual. Model viewer remembers the selected annotation marker.
 *
 * @param {Object} shape The shape object of the annotation marker which should be selected
 * @returns {undefined}
 */
showcase.annotater.selectAnnotation = function(shape) {

  // Remove hightlighting from previously selected annotation
  showcase.annotater.markers.clearSelection(showcase.annotater.selectedAnnotationId);

  showcase.annotater.selectedAnnotationId = shape.dataset.id;

  // Highlight the selected annotion marker with a different color
  showcase.annotater.markers.highlightShape(shape);
};

/**
 * Handler for clicking annotation marker
 * @param {type} event
 * @returns {undefined}
 */
showcase.annotater.handleAnnotationMarkerClick = function(event) {

  // 3D point where the user clicked
  var worldPos = event.hitPnt;

  // Get the id of the clicked annotation
  var shape = event.hitObject;

  showcase.annotater.selectAnnotation(shape);
  showcase.annotater.contentBox.showForWorldPos(worldPos);
};

/**
 * Mouse over listener for annotation markers. The annotation marker will have a
 * owner (may be the anonymous user). Emphasizes all annotation markers with the
 * same owner. This helps the user finding out which annotations belong together
 * (=are created by the same user).
 *
 * @param {Event} event
 * @returns {undefined}
 */
showcase.annotater.handleAnnotationMarkerMouseOver = function(event) {
  // Get the owner of the annotation marker
  var shape = event.hitObject;
  var annotationId = shape.dataset.id;
  var username = showcase.annotater.annotations[annotationId].annotationData.username;

  // For each annotation of the same owner ..
  for (var id in showcase.annotater.annotations) {
    if (showcase.annotater.annotations[id].annotationData.username === username) {
      // .. get the annotation marker shape ..
      var transformNode = showcase.annotater.markers.elements[id];
      // .. and emphsize it
      showcase.annotater.markers.emphasizeShape(transformNode.children[0]);
    }
  }
};

/**
 * Mouse out listener for annotation markers. Undo for the emphasizing created by
 * showcase.annotater.handleAnnotationMarkerMouseOver.
 *
 * @param {Event} event
 * @returns {undefined}
 */
showcase.annotater.handleAnnotationMarkerMouseOut = function(event) {
  // Get the owner of the annotation marker
  var shape = event.hitObject;
  var annotationId = shape.dataset.id;
  var username = showcase.annotater.annotations[annotationId].annotationData.username;

  // For each annotation of the same owner ..
  for (var id in showcase.annotater.annotations) {
    if (showcase.annotater.annotations[id].annotationData.username === username) {
      // .. check that it is not the currently selected annotation
      // (we do not want to change the selected annotations appearance) ..
      if (showcase.annotater.selectedAnnotationId !== id) {
        // .. and undo the emphasizing (by resetting all changes made to the markers appearance)
        showcase.annotater.markers.clearSelection(id);
      }
    }
  }
};

/** ****************************************************************************
 * This object provides functionality for all features related to the annotation
 * markers shown on the model
 *
 * @type Object
 * ****************************************************************************/
showcase.annotater.markers = {};

// Color used for a selected annotation marker
showcase.annotater.markers.SELECTION_COLOR = '1 1 0';
// Transparency of a selected annotation marker
showcase.annotater.markers.SELECTION_OPACITY = '0.0';
// An array of colors used for non-selected annotation markers
// Different colors indicate ownership by different users
// (one user will get first color, next user gets second color, ..)
showcase.annotater.markers.DEFAULT_COLORS = ['1 0 0', '0 1 0', '0 0 1', '1 0 1', '0 1 1', '1 1 1', '0 0 0'];
// Transparency of non-selected + non-mouseover annotation markers
showcase.annotater.markers.DEFAULT_OPACITY = '0.3';
// The index of the next unused color in the showcase.annotater.markers.DEFAULT_COLORS array
showcase.annotater.markers.nextColor = 0;
// A list of all annotation markers (the cone shapes). Note, that not the
// cone shape is stored directly in the list, but a transform node. The cone shape
// is the direct child of the transform node.
showcase.annotater.markers.elements = {};
// Object storing all materials assigned to annotation markers BY USER NAME. When
// displaying an annotation marker of a user this can be used to look up how it
// should look like.
showcase.annotater.markers.materials = {};

/**
 * x3dom scene graph does not allow adding the same material to different shapes.
 * As we need all annotation markers of a user to look the same, this is a convenience
 * function to copy the material of a user.
 *
 * @param {Material} material The material to be copied
 * @returns {Material} A new material with same diffuse color and transparency
 */
showcase.annotater.markers.copyMaterial = function(material) {

  var result = undefined;

  if (material !== undefined) {
    result = document.createElement('Material');

    result.setAttribute('diffuseColor', material.getAttribute('diffuseColor'));
    result.setAttribute('transparency', material.getAttribute('transparency'));
  }

  return result;
};

/**
 * Gets the material to be user for annotation markers of a certain user
 * @param {String} username The name of the user to derive the material for
 * @returns {Material} x3dom node for material
 */
showcase.annotater.markers.getMaterial = function(username) {

  var material = showcase.annotater.markers.copyMaterial(showcase.annotater.markers.materials[username]);

  if (material === undefined) {
    material = showcase.annotater.markers.getNewMaterial();
    showcase.annotater.markers.materials[username] = material;
  }

  return material;
};

/**
 * Shows a cone to mark the position of an annotation
 * @param {x3dom.fields.SFVec3f} pos The position of the annotation as x3dom vector
 * @param {x3dom.fields.SFVec3f} norm The normal vector of the annotation as
 * x3dom vector. This will define the direction in which this annotaion marker points
 * @param {int} id The Sevianno object id of the shown annotation. Will be stored
 * with the geometry shape to be able to reference the annotation when clicking the shape
 * @param {String} username The name of the user that owns the annotation. Is
 * required to decide upon the annotation markers appearance
 * @returns {undefined}
 */
showcase.annotater.markers.showAnnotationMarker = function(pos, norm, id, username) {
  // Code taken from http://examples.x3dom.org/v-must/ (Download the zip file and check main.js)
  // Will show a cone marking the position where a user clicked on the model
  // show 3d marker at pick position

  // rotate such that cone points to click point
  var qDir = x3dom.fields.Quaternion.rotateFromTo(new x3dom.fields.SFVec3f(0, -1, 0), norm);
  var rot = qDir.toAxisAngle();
  pos = pos.addScaled(norm, 9.5);  // since length is 10...

  var t = document.createElement('Transform');
  t.setAttribute("scale", "3 10 3" );
  t.setAttribute('rotation', rot[0].x+' '+rot[0].y+' '+rot[0].z+' '+rot[1]);
  t.setAttribute('translation', pos.x+' '+pos.y+' '+pos.z);

  var material = showcase.annotater.markers.getMaterial(username);

  var s = document.createElement('Shape');
  s.setAttribute('class', 'shape');
  // Store the id of an annotation with the cone shape. The id of the annotation
  // can thus be accessed when clicking the shape.
  s.dataset.id = id;
  t.appendChild(s);
  var b = document.createElement('Cone');
  s.appendChild(b);
  var a = document.createElement('Appearance');
  a.appendChild(material);
  s.appendChild(a);

  var ot = document.getElementById('annotation-markers');
  ot.appendChild(t);
  // End code taken from http://examples.x3dom.org/v-must/

  // Store the annotation marker globally in showcase.annotater (The full transform node is stored)
  showcase.annotater.markers.elements[id] = t;
};

/**
 * Removes the selection appearance from an annotation marker (by removing the
 * 'selection' material and attaching the 'standard' user material)
 * @param {String} annotationId Id of the annotation where annotation marker should no longer appear selected
 * @returns {undefined}
 */
showcase.annotater.markers.clearSelection = function(annotationId) {
  if (annotationId !== undefined) {
    var shape = showcase.annotater.markers.elements[annotationId].children[0];
    var username = showcase.annotater.annotations[annotationId].annotationData.username;
    var material = showcase.annotater.markers.getMaterial(username);
    shape.children[1].removeChild(shape.children[1].children[0]);
    shape.children[1].appendChild(material);
  }
};

/**
 * Makes an annotation marker stick out without making it look like being selected
 *
 * @param {Shape} shape The shape node of the annotation marker to be emphasized
 * @returns {undefined}
 */
showcase.annotater.markers.emphasizeShape = function(shape) {

  // Create a new material with the original color, but set the transparency like
  // for a selected annotation marker
  var material = document.createElement('Material');
  material.setAttribute('diffuseColor', shape.children[1].children[0].getAttribute('diffuseColor'));
  material.setAttribute('transparency', showcase.annotater.markers.SELECTION_OPACITY);
  shape.children[1].removeChild(shape.children[1].children[0]);
  shape.children[1].appendChild(material);
};

/**
 * Makes an annotatio marker look selected.
 *
 * @param {Shape} shape The annotation marker to be displayed as selected
 * @returns {undefined}
 */
showcase.annotater.markers.highlightShape = function (shape) {

  // Highlight the selected annotion marker with a different color
  var material = document.createElement('Material');
  material.setAttribute('diffuseColor', showcase.annotater.markers.SELECTION_COLOR);
  material.setAttribute('transparency', showcase.annotater.markers.SELECTION_OPACITY);
  shape.children[1].removeChild(shape.children[1].children[0]);
  shape.children[1].appendChild(material);
};

/**
 * Model viewer will display annotation markers of different users in differently.
 * If for a user you do not have a annotation marker material yet, you can use
 * this function to get an unused material for your annotation marker.
 *
 * @returns {Material} The new material
 */
showcase.annotater.markers.getNewMaterial = function () {

  // Create a new material with the next color from showcase.annotater.markers.DEFAULT_COLORS
  var material = document.createElement('Material');
  material.setAttribute('diffuseColor', showcase.annotater.markers.DEFAULT_COLORS[showcase.annotater.markers.nextColor]);
  material.setAttribute('transparency', showcase.annotater.markers.DEFAULT_OPACITY);

  // Update showcase.annotater.markers.nextColor. If all colors are already used, just
  // use the first color again.
  if (showcase.annotater.markers.nextColor + 1 > showcase.annotater.markers.DEFAULT_COLORS.length) {
    showcase.annotater.markers.nextColor = 0;
  }
  else {
    showcase.annotater.markers.nextColor++;
  }

  return material;
};

/** ****************************************************************************
 * This object provides functionality for all features related to the annotation
 * content box and its displayed contents
 *
 * @type Object
 * ****************************************************************************/
showcase.annotater.contentBox = {}

// Placeholder text for annotation content box in read mode when there is no title
showcase.annotater.contentBox.NO_TITLE_PLACEHOLDER = 'No Title';
// Placeholder text for annotation content box in read mode when there is no content
showcase.annotater.contentBox.NO_CONTENT_PLACEHOLDER = 'No content';

/**
 * Show the annotation content box for a user click. Positions the annotation content
 * box properly by moving it to the border of the viewer element
 * (relative to the mouse click position).
 *
 * @param {Array} pos2d 2D point where the user clicked (relative to page)
 * @returns {undefined}
 */
showcase.annotater.contentBox.show = function(pos2d) {

  var anno2D = $('#annotation-content');
  anno2D.removeClass('hidden');
  pos2d = showcase.annotater.contentBox.calcPosition(pos2d);
  anno2D.css('left', pos2d[0] + 'px');
  anno2D.css('top', pos2d[1] + 'px');

  showcase.annotater.contentBox.showContent();
};

/**
 * Shows an annotation content box properly positioned relative to 3D coordinates
 * of the global / world space
 *
 * @param {x3dom.fields.SFVec3f} worldPos 3D position
 * @returns {undefined}
 */
showcase.annotater.contentBox.showForWorldPos = function(worldPos) {

  var runtime = $("#viewer_object")[0].runtime;

  // x3dom can calculate the 2D position on the screen based on a 3D point
  var pos2d = runtime.calcPagePos(worldPos[0], worldPos[1], worldPos[2]);

  showcase.annotater.contentBox.show(pos2d);
};

/**
 * Shows the textual content of the currently selected annotation in the annotation
 * context box. Note, that the content is taken from showcase.annotater.annotations object.
 * You might need to update the object first by calling showcase.annotater.storeAnnotationLocally(annotation)
 *
 * @returns {undefined}
 */
showcase.annotater.contentBox.showContent = function() {

  var annotation = showcase.annotater.annotations[showcase.annotater.selectedAnnotationId];

  // If there is no annotation stored with the given id (or the id is undefined),
  // then the user has created a new annotation and the request to Sevianno is still in progress
  if (annotation === undefined) {
    showcase.annotater.contentBox.switchMode('loading');
  }
  else {
    // Updating the content in the "readonly" div
    if (annotation.title === undefined || annotation.title == '') {
      $('#header-annotation-content').html(showcase.annotater.contentBox.NO_TITLE_PLACEHOLDER);
    } else {
      $('#header-annotation-content').html(annotation.title);
    }
    if (annotation.text === undefined || annotation.text == '') {
      $('#p-annotation-content').html(showcase.annotater.contentBox.NO_CONTENT_PLACEHOLDER);
    }
    else {
      $('#p-annotation-content').html(annotation.text);
    }
    var username = annotation.annotationData.username;
    if (username === undefined && username === '') {
      $('#username-read').html(personality.ANONYMOUS_USERNAME);
    }
    else {
      $('#username-read').html(username);
    }
    // Updating the content in the "edit" div
    $('#input-annotation-title').val(annotation.title);
    $('#textarea-annotation-content').val(annotation.text);
  }
};

/**
 * Calculates a position for the annotation content window. Calculation is based
 * on the clicked position. The annotation is moved up to DELTA pixel to the border
 * of the viewer screen (it will always stay inside the viewer screen)
 * @param {Object} pos2d The 2D position where the user clicked (relative to webpage)
 * @returns {Object} The 2D position where to place the annotation (relative to webpage)
 */
showcase.annotater.contentBox.calcPosition = function(pos2d) {
  // The amount of pixels the annotation content is moved to the border (at most)
  var DELTA = 50;

  // Width of the viewer
  var width = $('#viewer_object').width();
  // Left border of the viewer
  var offsetLeft = $('#viewer_object').offset().left;
  // Width of the annotation content widow
  var divWidth = $('#annotation-content').outerWidth();

  // Move the position by DELTE to the nearest border (left / right)
  if (pos2d[0] < width / 2) {
    pos2d[0] -= divWidth + DELTA;
  }
  else {
    pos2d[0] += DELTA;
  }
  // If new position outside border, move exactly to border
  if (pos2d[0] < offsetLeft) {
    pos2d[0] = offsetLeft;
  }
  else if (pos2d[0] + divWidth > offsetLeft + width) {
    pos2d[0] = offsetLeft + width - divWidth;
  }

  // Heigth of the viewer
  var height = $('#viewer_object').height();
  // Top border of the viewer
  var offsetTop = $('#viewer_object').offset().top;
  // Height of the annotation content widow
  var divHeight = $('#annotation-content').outerHeight();

  // Move the position by DELTE to the nearest border (top / bottom)
  if (pos2d[1] < height / 2) {
    pos2d[1] -= divHeight + DELTA;
  }
  else {
    pos2d[1] += DELTA;
  }
  // If new position outside border, move exactly to border
  if (pos2d[1] < offsetTop) {
    pos2d[1] = offsetTop;
  }
  else if (pos2d[1] + divHeight > offsetTop + height) {
    pos2d[1] = offsetTop + height - divHeight;
  }

  return pos2d;
};

/**
 * Switches between the "readonly" div of the annotation content box and its "edit" div.
 * For the users point of view, this makes the content editable or non-editable
 * and shows the corresponding buttons.
 *
 * @param {type} mode
 * @returns {undefined}
 */
showcase.annotater.contentBox.switchMode = function(mode) {
  if (mode === 'edit') {
    $('#div-annotation-content-loading').addClass('hidden');
    $('#div-annotation-content-read').addClass('hidden');
    $('#div-annotation-content-edit').removeClass('hidden');
  }
  else if (mode === 'read') {
    $('#div-annotation-content-loading').addClass('hidden');
    $('#div-annotation-content-read').removeClass('hidden');
    $('#div-annotation-content-edit').addClass('hidden');
  }
  else if (mode === 'loading') {
    $('#div-annotation-content-loading').removeClass('hidden');
    $('#div-annotation-content-read').addClass('hidden');
    $('#div-annotation-content-edit').addClass('hidden');
  }
};

/**
 * Hides the annotation content box and resets all of its content
 *
 * @returns {undefined}
 */
showcase.annotater.contentBox.hide = function() {
  // Hide the whole content box
  $('#annotation-content').addClass('hidden');

  // Clear all input / output fields
  // Updating the content in the "readonly" div
  $('#header-annotation-content').html(showcase.annotater.contentBox.NO_TITLE_PLACEHOLDER);
  $('#p-annotation-content').html(showcase.annotater.contentBox.NO_CONTENT_PLACEHOLDER);
  // Updating the content in the "edit" div
  $('#input-annotation-title').val('');
  $('#textarea-annotation-content').val('');
};

showcase.addEventListener('load', function () {
  // Reading the Sevianno object id of the current model from our database (our php
  // server will store it in a hidden input field called model-sevianno-id)
  showcase.annotater.seviannoObjectId = $('#model-sevianno-id').val();

  if (showcase.annotater.seviannoObjectId == null || showcase.annotater.seviannoObjectId == '') {
      console.error('This object has no sevianno-id!')
      return
  }

  // Then reading all annotations from Sevianno which belong to this object id and display them
  showcase.annotater.connector.readAnnotations(showcase.annotater.seviannoObjectId, function(annos) {
    $.each(annos.annotations, function(i,n) {
      var annotation = n.annotation;
      var dbPos = annotation.annotationData.pos;
      var dbNorm = annotation.annotationData.norm;
      // Converting the position and normal vector received to x3dom vectors
      var pos = new x3dom.fields.SFVec3f(dbPos.x, dbPos.y, dbPos.z);
      var norm = new x3dom.fields.SFVec3f(dbNorm.x, dbNorm.y, dbNorm.z);
      showcase.annotater.markers.showAnnotationMarker(pos, norm, annotation.id, annotation.annotationData.username);

      showcase.annotater.storeAnnotationLocally(annotation);
    });
  });

  $('#x3dInline')[0].addEventListener('click', function (event) {
    if (showcase.toolbar.annotate) {
      var pos = new x3dom.fields.SFVec3f(event.worldX, event.worldY, event.worldZ);
      var norm = new x3dom.fields.SFVec3f(event.normalX, event.normalY, event.normalZ);
      
      showcase.annotater.createAnnotation(pos, norm);

      showcase.toolbar.toggleAnnotationMode(true);
    }
  })
})

showcase.addEventListener('load', function () {
})

// Initializing model viewer
$(document).ready(function() {

  // Deactivate x3d-hotkeys while editing annotation
  $('#textarea-annotation-content').on('keypress keydown keyup', function (e) { e.stopPropagation(); });
  $('#input-annotation-title').on('keypress keydown keyup', function (e) { e.stopPropagation(); });

  // Register handler for close button in annotation content window
  $('#btn-annotation-content-close').on('click', function() {
    showcase.annotater.contentBox.hide();
    // There is no more annotation selected
    showcase.annotater.markers.clearSelection(showcase.annotater.selectedAnnotationId);

    showcase.annotater.selectedAnnotationId = undefined;
  });

  // Handler for the edit button in div-annotation-content-read. Switches to div-annotation-content-edit
  $('#btn-annotation-edit').on('click', function() {
    showcase.annotater.contentBox.switchMode('edit');
  });

  // Handler for the edit button in div-annotation-content-edit. Switches to
  // div-annotation-content-read without saving user input.
  $('#btn-annotation-cancel').on('click', function() {
    showcase.annotater.contentBox.switchMode('read');
  });

  // Handler for the edit button in div-annotation-content-edit. Switches to
  // div-annotation-content-read while saving all user input at the Sevianno service
  $('#btn-annotation-save').on('click', showcase.annotater.updateAnnotation);

  // Handler for clicking the delete button in div-annotation-content-read
  $('#btn-annotation-delete').on('click', showcase.annotater.deleteAnnotation);
});
