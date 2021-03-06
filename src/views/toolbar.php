<?php
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
 * @file toolbar.php
 * Toolbar with controls for the viewer navigation and other viewer functionality
 * 
 * REQUIRES menu.php to be included before
 */
?>

<script type="text/javascript" src="../js/showcase-toolbar.js"></script>


<!-- Toolbar -->
<nav class="navbar toolbar navbar-inverse" role="navigation">
  <div class="container-fluid">
    <!-- Brand and toggle get grouped for better mobile display -->
    <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand" href="#">3-D Model Viewer</a>
    </div>
    <!-- Collect the nav links, forms, and other content for toggling -->
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul id="tool-list" class="nav navbar-nav">
        <li role="presentation" class="dropdown navbar-li">
          <select id="viewModeSelect" onChange="showcase.toolbar.x3dChangeView()" class="form-control navbar-select">
            <!-- option>[W]alk</option>
            <option id="optionExamine">[E]xamine</option>
            <option>[F]ly</option>
            <option>[H]elicopter</option>
            <option>[L]ookAt</option>
            <option>[T]urntable</option>
            <option>[G]ame</option -->
          </select>
        </li>
        <li class="navbar-li"><button type="submit" class="btn btn-default navbar-btn form-control" id="btnResetview">Reset view [A]</button></li>
      <?php
        // If and only if inside ROLE environment, show the synchronize / unsynchronize button
        if(true || filter_input(INPUT_GET, "widget") == "true") {
      ?>
          <li class="navbar-li"><input type="checkbox" data-on-text="Sync" data-label-width="0" data-off-text="Not Sync" id="btnSynchronize"></input></li>
      <?php
          }
      ?>
        <li class="navbar-li"><input type="checkbox" data-on-text="Info" data-label-width="0" data-off-text="No Info" id="btnInfo"></input></li>
        <li class="navbar-li"><input type="checkbox" data-on-text="Help" data-label-width="0" data-off-text="No Help" id="btnHelp"></input></li>
        <li class="navbar-li"><button type="submit" class="btn btn-default navbar-btn form-control" id="btnAnnotate">Annotate</button></li>
        <li class="navbar-li"><input type="checkbox" data-on-text="Double click parts" data-label-width="0" data-off-text="Highlight is off" id="btnHighlight"></input></li>
        <!-- Show lecturer mode button only if user logged in (as lecturer) and in ROLE environment -->
        <?php
          ob_start();
          require '../php/access_control.php';
          $accessControl = new AccessControl();
          $canEnterLecturerMode = $accessControl->canEnterLecturerMode();          
          ob_end_clean(); 
          
          if (true || $canEnterLecturerMode && (filter_input(INPUT_GET, "widget") == "true")) { 
        ?>
        <li class="navbar-li"><input type="checkbox" data-on-text="Lecturer on" data-label-width="0" data-off-text="Lecturer off" id="btnLecturer"></input></li>
        <!-- A span which will be filled with a Sign In button or information about which user is currently logged in. Will be filled in oidc-button.js -->
        <li class="navbar-li">
          <span id="signinButton">
            <span class="oidc-signin"
              data-callback="personality_signinCallback"
              data-name="Learning Layers"
              data-logo="https://raw.githubusercontent.com/learning-layers/LayersToolTemplate/master/extras/logo.png"
              data-server="https://api.learning-layers.eu/o/oauth2"
              data-clientid=<?php echo($oidcClientId); ?>
              data-scope="openid phone email address profile">
            </span>
          </span>
        </li>
        <?php 
          }
        ?>
      </ul>
    </div><!-- /.navbar-collapse -->
  </div><!-- /.container-fluid -->
</nav>

<?php 
// If we are in a ROLE space, show the Sign in button / Sign in status
if(filter_input(INPUT_GET, "widget") == "true") {
?>
<script type="text/javascript">
  (function() {
    var po = document.createElement('script'); 
    po.type = 'text/javascript'; 
    po.async = true;
    po.src = '../js/oidc-button.js';
    var s = document.getElementsByTagName('script')[0]; 
    s.parentNode.insertBefore(po, s);
  })();
</script>
<?php
}
?>
