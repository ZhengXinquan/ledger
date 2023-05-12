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


$payBudget = new payBudget();

if (isset($_POST['info'])) {
	$postInfo = $_POST['info'];
	switch ($postInfo) {
		
		case 'copy_by_month' :
		if (isset($_POST['month'])) {
			$pmonth_ = $_POST['month'].'-01';
			$payBudget -> copy($pmonth_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		
		break;


		case 'select_by_month' :
		if (isset($_POST['month'])) {
			$pmonth_ = $_POST['month'];
			$payBudget -> select($pmonth_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		
		break;
		case 'delete' :
		if (isset($_POST['ids'])) {
			$ids_ = $_POST['ids'];
			$payBudget -> delete($ids_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'insert' :
		if (isset($_POST['tid']) and isset($_POST['m']) and isset($_POST['d'])) {
			$sid_ = $_POST['tid'];
			$pmoney_= $_POST['m'];
			$pmonth_= $_POST['d'].'-01';
			$payBudget -> insert($sid_,$pmoney_,$pmonth_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_type' :
		if (isset($_POST['id']) and isset($_POST['tid'])) {
			$id_ = $_POST['id'];
			$sid_ = $_POST['tid'];
			$payBudget -> updateType($id_,$sid_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_detail' :
		if (isset($_POST['id']) and isset($_POST['m']) and isset($_POST['d'])) {
			$id_ = $_POST['id'];
			$pmoney = $_POST['m'];
			$pmonth_ = $_POST['d'];
			$payBudget -> updateDetail($id_,$pmoney,$pmonth_);
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
mysqli_close($payBudget -> con);
// $payBudget->insert('适d',2);
// $payBudget  -> hide(2);
// $payBudget -> show(3);
// $payBudget -> updatePX(1,6);
// $payBudget -> updateName(3,"xiaoMing");
