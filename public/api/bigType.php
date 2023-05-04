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


$bigType = new bigType();

if (isset($_POST['info'])) {
	$postInfo = $_POST['info'];
	switch ($postInfo) {
		case "px":
		if (isset($_POST['list'])) {
			$obj=json_decode($_POST['list']);
			foreach ($obj as $key=>$value)
			{
				$bigType -> updatePX($key,$value,0);
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
			$bigType -> show($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'hide' :
		if (isset($_POST['id'])) {
			$id_ = $_POST['id'];
			$bigType -> hide($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'delete' :
		if (isset($_POST['id'])) {
			$id_ = $_POST['id'];
			$bigType -> delete($id_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'insert' :
		if (isset($_POST['n']) and isset($_POST['m'])) {
			$bname_ = $_POST['n'];
			$btype_ = $_POST['m'];
			$bigType -> insert($bname_, $btype_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_name' :
		if (isset($_POST['id']) and isset($_POST['n'])) {
			$id_ = $_POST['id'];
			$bname_ = $_POST['n'];
			$bigType -> updateName($id_,$bname_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'update_px' :
		if (isset($_POST['id']) and isset($_POST['p'])) {
			$id_ = $_POST['id'];
			$bpx_ = $_POST['p'];
			$bigType -> updatePX($id_,$bpx_);
		} else {
			$json_data = array('tip' => 0, 'd' => 'post params wrong');
			echo json_encode($json_data);
		}
		break;
		case 'select_income' :
		$bigType -> select(1);
		break;
		case 'select_pay' :
		$bigType -> select();
		break;
		case 'select_all_income' :
		$bigType -> selectAll(1);
		break;
		case 'select_all_pay' :
		$bigType -> selectAll();
		break;
	}
}
mysqli_close($bigType -> con);
// $bigType->insert('适d',2);
// $bigType  -> hide(2);
// $bigType -> show(3);
// $bigType -> updatePX(1,6);
// $bigType -> updateName(3,"xiaoMing");
