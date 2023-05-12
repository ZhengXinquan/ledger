<?php
class income {
	public $con;
	public $id;
	public $bid;
	public $iname;
	public $imoney;
	public $iday;
	public $itime;
	public $cid;
	public function __construct() {
		$connectSql = new sql();
		$this-> con = $connectSql-> con ;

// <!-- 按日查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y-%m-%d') as time,sum(money) money FROM o_finance_detail where org_id = 1000  GROUP BY  time  
// <!-- 按月查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y-%m') as time,sum(money)  money FROM o_finance_detail where org_id = 1000  GROUP BY  time  
// <!-- 按年查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y') as time,sum(money)  money FROM o_finance_detail where org_id = 1000  GROUP BY  time   
// <!-- 按周查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y-%u') as time,sum(money)  money FROM o_finance_detail where org_id = 1000  GROUP BY  time  


	}
	
	public function delete($id_) {
		$this -> id = $id_;
		$re=mysqli_query($this-> con,"DELETE FROM `aa_income` WHERE id='$this->id'");
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed DELETE incom ');
		}else{
			$json_data = array('tip' => 0, 'd' => 'DELETE failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updateDetail($id_,$iname_,$imoney_,$iday_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_income` SET `iname`='$iname_',`imoney`='$imoney_', `iday`='$iday_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE account_book type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'updateDetail failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updateType($id_,$bid_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_income` SET `bid`='$bid_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE account_book type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'updateType failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function insert($bid_, $iname_,$imoney,$iday_) {
		$sql = "INSERT INTO aa_income (bid, iname,imoney,iday) VALUES ('$bid_', '$iname_','$imoney','$iday_')";
		$re = mysqli_query($this-> con, $sql);

		// 输出自动生成的 ID
		//$nid = mysqli_insert_id($this-> con); 

		if($re){
			
			//mysqli_query($this->con,"UPDATE aa_big_type SET bpx = '$nid' WHERE id='$nid' ");
			$json_data = array('tip' => 1, 'd' => 'Succeed insert income');
		} else {

			$json_data = array('tip' => 0, 'd' => 'Insert failed');
		}
		echo json_encode($json_data);
	}



}
?>