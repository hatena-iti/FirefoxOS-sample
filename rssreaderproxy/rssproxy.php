<?php 

require_once "common.php";

header("Access-Control-Allow-Origin: *");

$url = $_GET["url"];

if(defined('HTTP_PROXY') ) {
	$proxy = array(
		"http" => array(
			"proxy" => str_replace("http:", "tcp:", HTTP_PROXY), //http only now
			"request_fulluri" => true,
		)
	);
	
	echo file_get_contents($url, false, stream_context_create($proxy));
}
else {
	echo file_get_contents($url);
}

