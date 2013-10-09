<?php 
/* 
 * Copyright 2013 Intelligent Technology Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
require_once "common.php";

//domainを制限するなどの対策が望ましいが、とりあえず「*」
header("Access-Control-Allow-Origin: *");

header("Content-type: text/html;charset=utf-8");

$url = $_GET["url"];

$data = "";
if(defined('HTTP_PROXY') && HTTP_PROXY) {
	$proxy = array(
		"http" => array(
			"proxy" => str_replace("http:", "tcp:", HTTP_PROXY), //http only now
			"request_fulluri" => true,
		)
	);
	
	$data = file_get_contents($url, false, stream_context_create($proxy));
}
else {
	$data = file_get_contents($url);
}

mb_language('Japanese');
echo mb_convert_encoding($data, "UTF-8", "auto");