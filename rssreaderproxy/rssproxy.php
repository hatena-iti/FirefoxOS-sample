<?php 

require_once "common.php";

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