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


$accountBook = new accountBook();

if (isset($_POST['info'])) {
	$postInfo = $_POST['info'];
	switch ($postInfo) {
		case 'selectBillByYear':
		if (isset($_POST['year'])) {
			$year_ = $_POST['year'];
			$accountBook -> selectBillByYear($year_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'selectPayDetailByTime':
		if (isset($_POST['d']) and isset($_POST['t'])) {
			$time_ = $_POST['d'];
			$type_ = $_POST['t'];
			$accountBook -> selectPayDetailByTime($time_,$type_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'selectPayDetailBySidAndTime':
		if (isset($_POST['id']) and isset($_POST['d']) and isset($_POST['t'])) {
			$sid_ = $_POST['id'];
			$time_ = $_POST['d'];
			$type_ = $_POST['t'];
			$accountBook -> selectPayDetailBySidAndTime($sid_,$time_,$type_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'select_by_month' :
		if (isset($_POST['month'])) {
			$aday_ = $_POST['month'];
			$accountBook -> select($aday_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		
		break;
		case 'search' :
			if (isset($_POST['st'])||isset($_POST['et'])||isset($_POST['n'])||isset($_POST['bn'])||isset($_POST['sn'])) {
				$start_ = $_POST['st'];
				$end_ = $_POST['et'];
				$word_ = $_POST['n'];
				$bn_ = $_POST['bn'];
				$sn_ = $_POST['sn'];

				$accountBook -> search($start_,$end_,$word_,$bn_,$sn_);
			} else {
				$json_data = array('tip' => 0, 'd' => 'post params wrong');
				echo json_encode($json_data);
			}
			break;
		case 'delete' :
		if (isset($_POST['id'])) {
			$id_ = $_POST['id'];
			$accountBook -> delete($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'insert' :
		if (isset($_POST['tid']) and isset($_POST['n']) and isset($_POST['m']) and isset($_POST['d'])) {
			$sid_ = $_POST['tid'];
			$aname_ = $_POST['n'];
			$amoney= $_POST['m'];
			$aday_= $_POST['d'];
			$accountBook -> insert($sid_, $aname_,$amoney,$aday_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_type' :
		if (isset($_POST['id']) and isset($_POST['tid'])) {
			$id_ = $_POST['id'];
			$sid_ = $_POST['tid'];
			$accountBook -> updateType($id_,$sid_);
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
			$accountBook -> updateDetail($id_,$aname_,$amoney,$aday_);
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
mysqli_close($accountBook -> con);
// $accountBook->insert('适d',2);
// $accountBook  -> hide(2);
// $accountBook -> show(3);
// $accountBook -> updatePX(1,6);
// $accountBook -> updateName(3,"xiaoMing");
