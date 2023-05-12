<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header('Access-Control-Allow-Headers:x-requested-with,content-type');

ini_set("display_errors", "On");//打开错误提示
ini_set("error_reporting",E_ALL);//显示所有错误

require ("../class/autoLoading.php");

// if (!isset($_SESSION['login'])) {
// 	$json_data = array('tip' => 0, 'd' => 'no login');
// 	echo json_encode($json_data);
// 	exit();
// }


$income = new income();

if (isset($_POST['info'])) {
	$postInfo = $_POST['info'];
	switch ($postInfo) {
		// case 'select_by_month' :
		// if (isset($_POST['month'])) {
			// $aday_ = $_POST['month'];
			// $income -> select($aday_);
		// } else {
			// $json_data = array('tip' => 0, 'd' => 'post params wrong');
			// echo json_encode($json_data);
		// }		
		// break;
		case 'delete' :
		if (isset($_POST['id'])) {
			$id_ = $_POST['id'];
			$income -> delete($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'insert' :
		if (isset($_POST['tid']) and isset($_POST['n']) and isset($_POST['m']) and isset($_POST['d'])) {
			$bid_ = $_POST['tid'];
			$aname_ = $_POST['n'];
			$amoney= $_POST['m'];
			$aday_= $_POST['d'];
			$income -> insert($bid_, $aname_,$amoney,$aday_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_type' :
		if (isset($_POST['id']) and isset($_POST['tid'])) {
			$id_ = $_POST['id'];
			$bid_ = $_POST['tid'];
			$income -> updateType($id_,$bid_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_detail' :
		if (isset($_POST['id']) and isset($_POST['n']) and isset($_POST['m']) and isset($_POST['d'])) {
			$id_ = $_POST['id'];
			$aname_ = $_POST['n'];
			$amoney = $_POST['m'];
			$aday_ = $_POST['d'];
			$income -> updateDetail($id_,$aname_,$amoney,$aday_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		default:
		$json_data = array('tip' => 0, 'd' => 'action wrong');
		echo json_encode($json_data);
	}
}
mysqli_close($income -> con);
// $income->insert('适d',2);
// $income  -> hide(2);
// $income -> show(3);
// $income -> updatePX(1,6);
// $income -> updateName(3,"xiaoMing");
