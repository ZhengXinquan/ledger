<?php
class payBudget {
	public $con;
	public $id;
	public $sid;
	public $pmoney;
	public $pmonth;
	public $ptime;
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
	public function copy($pmonth_) {
		$thisMonth = date("Y-m", strtotime("first day of -1 month", strtotime($pmonth_)));
		
		$sql = "
INSERT INTO aa_pay_budget (sid, pmoney, pmonth) SELECT
	sid,
	pmoney,
	DATE_FORMAT('$pmonth_', '%Y-%m-%d')
FROM
	aa_pay_budget
WHERE
	DATE_FORMAT(pmonth, '%Y-%m') = '$thisMonth'  ";

	
		$result = mysqli_query($this-> con,$sql);
		if($result){
			$json_data = array('tip' => 1, 'd' => 'Succeed insert pay_budget ');
		} else {
			$json_data = array('tip' => 0, 'd' => 'Insert failed'.$sql);
		}
		echo json_encode($json_data);
	}
	public function select($pmonth_) {
		$sql = "
SELECT
	pb.id,
	pb.sid,
	s.bid,
	pb.pmoney AS m,
	pb.pmonth AS d,
	s.sname AS sn,
	b.bname AS bn,
	IFNULL(a.summoney,0) AS pm,
	pb.pmoney-IFNULL(a.summoney,0) AS lm
FROM
	aa_pay_budget pb
LEFT JOIN aa_small_type s ON pb.sid = s.id
LEFT JOIN aa_big_type b ON s.bid = b.id
LEFT JOIN (
	SELECT
		id AS aid,
		sid AS sid,
		sum(amoney) AS summoney
	FROM
		aa_account_book
	WHERE
		DATE_FORMAT(aday, '%Y-%m') = '$pmonth_'
	GROUP BY
		sid
) a ON pb.sid = a.sid
WHERE
	DATE_FORMAT(pb.pmonth, '%Y-%m') = '$pmonth_'
ORDER BY
	pb.pmoney DESC,
	pb.ptime DESC";
		$result = mysqli_query($this-> con,$sql);
		$d = array();
		if (mysqli_num_rows($result) > 0) {
			while ($row = mysqli_fetch_object($result)) {
				array_push($d, $row);
			}
			$json_data = array('tip' => 1, 'd' => $d);
		} else {
			$json_data = array('tip' => 1, 'd' =>  $d );
		}
		echo json_encode($json_data);
	}
	public function delete($ids_) {
	
		$re=mysqli_query($this-> con,"DELETE FROM `aa_pay_budget` WHERE FIND_IN_SET (id,'$ids_') ");
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed DELETE pay_budget');
		}else{
			$json_data = array('tip' => 0, 'd' => 'DELETE failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updateDetail($id_,$pmoney_,$pmonth_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_pay_budget` SET  `pmoney`='$pmoney_', `pmonth`='$pmonth_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE pay_budget type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'updateDetail failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updateType($id_,$sid_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_pay_budget` SET `sid`='$sid_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE pay_budget type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'updateType failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function insert($sid_, $pmoney_,$pmonth_) {
		$sql = "INSERT INTO aa_pay_budget (sid, pmoney,pmonth) VALUES ('$sid_', '$pmoney_','$pmonth_')";
		$re = mysqli_query($this-> con, $sql);

		// 输出自动生成的 ID
		//$nid = mysqli_insert_id($this-> con); 
		if($re){
			//mysqli_query($this->con,"UPDATE aa_big_type SET bpx = '$nid' WHERE id='$nid' ");
			$json_data = array('tip' => 1, 'd' => 'Succeed insert pay_budget ');
		} else {

			$json_data = array('tip' => 0, 'd' => 'Insert failed'.$sql);
		}
		echo json_encode($json_data);
	}



}
?>