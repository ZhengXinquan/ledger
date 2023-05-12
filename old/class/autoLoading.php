<?php
header("Content-type: text/html; charset=utf-8");
session_start();
spl_autoload_register(function ($class) 
{
	if (file_exists("class." . $class . ".php")) {
		require_once ("class." . $class . ".php");
			// /class/
	} else if (file_exists("class/class." . $class . ".php")) {
		require_once ("class/class." . $class . ".php");
	} else if (file_exists("../class/class." . $class . ".php")) {
		require_once ("../class/class." . $class . ".php");
	} else if (file_exists("../../class/class." . $class . ".php")) {
		require_once ("../../class/class." . $class . ".php");
		// /zz_services/
	} else if (file_exists("zz_services/class." . $class . ".php")) {
		require_once("zz_services/class." . $class . ".php");
	} else if (file_exists("../zz_services/class." . $class . ".php")) {
		require_once("../zz_services/class." . $class . ".php");
	} else if (file_exists("../../zz_services/class." . $class . ".php")) {
		require_once("../../zz_services/class." . $class . ".php");
		// /db/
	} else if (file_exists("db/class." . $class . ".php")) {
		require_once("db/class." . $class . ".php");
	} else if (file_exists("../db/class." . $class . ".php")) {
		require_once("../db/class." . $class . ".php");
	} else if (file_exists("../../db/class." . $class . ".php")) {
		require_once("../../db/class." . $class . ".php");
	} else if (file_exists("../../../db/class." . $class . ".php")) {
		require_once("../../../db/class." . $class . ".php");
	} else if (file_exists("../../../../db/class." . $class . ".php")) {
		require_once("../../../../db/class." . $class . ".php");
	} else {
		echo "【Did not find this " . $class . " class 】";
	}
});
