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


$smallType = new smallType();

if (isset($_POST['info'])) {
	$postInfo = $_POST['info'];
	switch ($postInfo) {
		case "px":
		if (isset($_POST['list'])) {
			$obj=json_decode($_POST['list']);
			foreach ($obj as $key=>$value)
			{
				$smallType -> updatePX($key,$value,0);
			}
			$json_data = array('tip' => 1, 'd' => 'success');
			echo json_encode($json_data);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'show' :
		if (isset($_POST['id'])) {
			$id_ = $_POST['id'];
			$smallType -> show($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'hide' :
		if (isset($_POST['id'])) {
			$id_ = $_POST['id'];
			$smallType -> hide($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'delete' :
		if (isset($_POST['id'])) {
			$id_ = $_POST['id'];
			$smallType -> delete($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'insert' :
		if (isset($_POST['n']) and isset($_POST['m'])) {
			$bname_ = $_POST['n'];
			$bid_ = $_POST['m'];
			
			$smallType -> insert($bname_, $bid_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_name' :
		if (isset($_POST['id']) and isset($_POST['n'])) {
			$id_ = $_POST['id'];
			$bname_ = $_POST['n'];
			$smallType -> updateName($id_,$bname_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_px' :
		if (isset($_POST['id']) and isset($_POST['p'])) {
			$id_ = $_POST['id'];
			$bpx_ = $_POST['p'];
			$smallType -> updatePX($id_,$bpx_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'select_income' :
		$smallType -> select(1);
		break;
		case 'select_pay' :
		$smallType -> select();
		break;
		case 'select_all_income' :
		$smallType -> selectAll(1);
		break;
		case 'select_all_pay' :
		$smallType -> selectAll();
		break;
		default:
		$json_data = array('tip' => 0, 'd' => 'action wrong');
		echo json_encode($json_data);
	}
}
mysqli_close($smallType -> con);
// $smallType->insert('适d',2);
// $smallType  -> hide(2);
// $smallType -> show(3);
// $smallType -> updatePX(1,6);
// $smallType -> updateName(3,"xiaoMing");
