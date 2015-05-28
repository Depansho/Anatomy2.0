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
 * @file upload_script_course.php
 * 
 * Adss new course to the course database on the server
 * adds metadata about it database.
 */

session_start();

//create database connection (needs to be done before mysql_real_escape_string)
$conn = require '../php/db_connect.php';


//Get input data from form
$name = mysql_real_escape_string(filter_input(INPUT_POST, 'name'));
$text = mysql_real_escape_string(filter_input(INPUT_POST, 'text'));
$role_link = filter_input(INPUT_POST, 'roleLink');
$contact = filter_input(INPUT_POST, 'contact');
$dates = filter_input(INPUT_POST, 'dates');
$links = filter_input(INPUT_POST, 'links');

// Get id of currently logged in user
$creator = $_SESSION["user_id"];
	
// Create database-entry
$sql = "INSERT INTO courses (name, description, creator, role_url, contact, dates, links) VALUES ('$name','$text', $creator, '$role_link', '$contact', '$dates', '$links')";

$conn->query($sql);

$last_id = $conn->lastInsertId();

$html = "";
if(isset($_GET['widget']) && $_GET['widget'] == 'true') {$html = "&widget=true";}

header("Location: ../views/editcourse.php?id=$last_id$html");

?>
