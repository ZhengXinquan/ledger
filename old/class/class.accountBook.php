<?php
class accountBook {
	public $con;
	public $id;
	public $sid;
	public $aname;
	public $amoney;
	public $aday;
	public $atime;
	public $cid;
	public function __construct() {
		$connectSql = new sql();

		$this-> con = $connectSql-> con ;

		mysqli_query($this -> con,"SET NAMES 'utf8mb4'");

// <!-- 按日查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y-%m-%d') as time,sum(money) money FROM o_finance_detail where org_id = 1000  GROUP BY  time  
// <!-- 按月查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y-%m') as time,sum(money)  money FROM o_finance_detail where org_id = 1000  GROUP BY  time  
// <!-- 按年查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y') as time,sum(money)  money FROM o_finance_detail where org_id = 1000  GROUP BY  time   
// <!-- 按周查询 -->  
// SELECT DATE_FORMAT(created_date,'%Y-%u') as time,sum(money)  money FROM o_finance_detail where org_id = 1000  GROUP BY  time  


	}
	public function selectBillByYear($year_){
		$sql = "SELECT
	a.d AS d,
	a.m AS pay,
	IFNULL(i.m, 0) AS income,
	IFNULL(p.m, 0) AS budget,
	IFNULL(i.m, 0) - a.m AS lincome,
	IFNULL(p.m, 0) - a.m AS lbudget
FROM
	(
		SELECT
			DATE_FORMAT(aday, '%Y-%m') AS d,
			sum(amoney) AS m
		FROM
			aa_account_book
		WHERE
			DATE_FORMAT(aday, '%Y') = '$year_'
		GROUP BY
			DATE_FORMAT(aday, '%Y-%m')
	) a
LEFT JOIN (
	SELECT
		DATE_FORMAT(iday, '%Y-%m') AS d,
		sum(imoney) AS m
	FROM
		aa_income
	WHERE
		DATE_FORMAT(iday, '%Y') = '$year_'
	GROUP BY
		DATE_FORMAT(iday, '%Y-%m')
) i ON a.d = i.d
LEFT JOIN (
	SELECT
		DATE_FORMAT(pmonth, '%Y-%m') AS d,
		sum(pmoney) AS m
	FROM
		aa_pay_budget
	WHERE
		DATE_FORMAT(pmonth, '%Y') = '$year_'
	GROUP BY
		DATE_FORMAT(pmonth, '%Y-%m')
) p ON a.d = p.d ORDER by a.d DESC";
		$result = mysqli_query($this-> con,$sql);
	
		$d = array();
		$sum1 = 0;
		$sum2 = 0;
		$sum3 = 0;
		$sum4 = 0;
		$sum5 = 0;
		if (mysqli_num_rows($result) > 0) {
			while ($row = mysqli_fetch_object($result)) {
				array_push($d, $row);
				$sum1+=$row->pay;
				$sum2+=$row->income;
				$sum3+=$row->budget;
				$sum4+=$row->lincome;
				$sum5+=$row->lbudget;
			}
			$json_data = array('tip' => 1, 'd' => array('d'=>$d,'pay'=>$sum1,'income'=>$sum2,'budget'=>$sum3,'lincome'=>$sum4,'lbudget'=>$sum5));
		} else {
			$json_data = array('tip' => 1, 'd' => array('d'=>$d,'pay'=>$sum1,'income'=>$sum2,'budget'=>$sum3,'lincome'=>$sum4,'lbudget'=>$sum5));
		}
		echo json_encode($json_data);
	}
	public function selectPayDetailByTime($time_,$type_){
		$sql_type = '';
		if($type_=='week'){
			$sql_type = "AND DATE_FORMAT(aday,'%x-%v') = '$time_'";//2020-42 2020年第42周 周一为一周的第一天
		}
		if($type_=='month'){
			$sql_type = "AND DATE_FORMAT(aday,'%Y-%m') = '$time_'";//2020-10
		}
		if($type_=='year'){
			$sql_type = "AND DATE_FORMAT(aday,'%Y') = '$time_'";//2020
		}
		$sql = "
		SELECT
			a.id,
			a.sid as tid,
			b.id as bid,
			b.bname as bn,
			s.sname AS tn,
			a.aname AS n,
			a.amoney AS m,
			a.aday AS d,a.atime as t
		FROM
			aa_account_book a
		LEFT JOIN aa_small_type s ON a.sid = s.id
		LEFT JOIN aa_big_type b ON b.id = s.bid
		WHERE 1=1 ".$sql_type." ORDER BY m DESC ";
		$result = mysqli_query($this-> con,$sql);
	
		$d = array();
		$sum = 0;
		if (mysqli_num_rows($result) > 0) {
			while ($row = mysqli_fetch_object($result)) {
				array_push($d, $row);
				$sum+=$row->m;
			}
			$json_data = array('tip' => 1, 'd' => array('d'=>$d,'sum'=>$sum));
		} else {
			$json_data = array('tip' => 1, 'd' => array('d'=>$d,'sum'=>$sum));
		}
		echo json_encode($json_data);
	}
	public function selectPayDetailBySidAndTime($sid_,$time_,$type_){
		$sql_type = '';
		if($type_=='week'){
			$sql_type = "AND DATE_FORMAT(aday,'%Y-%u') = '$time_'";//2020-42 2020年第42周 周一为一周的第一天
		}
		if($type_=='month'){
			$sql_type = "AND DATE_FORMAT(aday,'%Y-%m') = '$time_'";//2020-10
		}
		if($type_=='year'){
			$sql_type = "AND DATE_FORMAT(aday,'%Y') = '$time_'";//2020
		}
		$sql = "
		SELECT
			a.id,
			a.sid as tid,
			s.sname AS tn,
			a.aname AS n,
			a.amoney AS m,
			a.aday AS d,2 as t
		FROM
			aa_account_book a
		LEFT JOIN aa_small_type s ON a.sid = s.id
		WHERE sid = '$sid_' ".$sql_type." ORDER BY m DESC ";
		$result = mysqli_query($this-> con,$sql);
		$d = array();
		$sum = 0;
		if (mysqli_num_rows($result) > 0) {
			while ($row = mysqli_fetch_object($result)) {
				array_push($d, $row);
				$sum+=$row->m;
			}
			$json_data = array('tip' => 1, 'd' => array('d'=>$d,'sum'=>$sum));
		} else {
			$json_data = array('tip' => 1, 'd' => array('d'=>$d,'sum'=>$sum));
		}
		echo json_encode($json_data);
	}
	public function search($start_,$end_,$word_,$bn_,$sn_){
		$sql_time_i = "";
		$sql_time_a = "";
		if($start_){
			$sql_time_i .= "AND	a.iday > '$start_'";
			$sql_time_a .= "AND	a.aday > '$start_'";
		}
		if($end_){
			$sql_time_i .= "AND	a.iday < '$end_'";
			$sql_time_a .= "AND a.aday < '$end_'";
		}
		$sql_word_i = "";
		$sql_word_a = "";
		if($word_){
			$sql_word_i.=" AND  a.iname LIKE '%$word_%' ";
			$sql_word_a.=" AND  a.aname LIKE '%$word_%' ";
		}
		if($bn_){
			$sql_word_i.=" AND  b.bname = '$bn_' ";
			$sql_word_a.=" AND b.bname =  '$bn_' ";
		}
		if($sn_){
			$sql_word_a.=" AND s.sname =  '$sn_' ";
		}

		$sql = "SELECT
		a.id,
		b.id AS tid,
		b.id AS bid,
		b.btype AS tt,
		b.bname AS tn,
		b.bname AS bn,
		a.iname AS n,
		a.imoney AS m,
		a.iday AS d,
		a.itime AS t
	FROM
		aa_income a
	LEFT JOIN aa_big_type b ON b.id = a.bid
	WHERE
		1 = 1
		".$sql_time_i.$sql_word_i."
	UNION
		SELECT
			a.id,
			s.id AS tid,
			b.id AS bid,
			b.btype AS tt,
			b.bname AS bn,
			s.sname AS tn,
			a.aname AS n,
			a.amoney AS m,
			a.aday AS d,
			a.atime AS t
		FROM
			aa_account_book a
		LEFT JOIN aa_small_type s ON a.sid = s.id
		LEFT JOIN aa_big_type b ON b.id = s.bid
		WHERE
		1 = 1
		".$sql_time_a.$sql_word_a."
		ORDER BY
			d DESC,
			t DESC";
		
			// echo $sql;

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
	public function select($aday_) {
		$sql = "
			SELECT
				a.id,
				b.id AS tid,
				b.id AS bid,
				b.btype AS tt,
				b.bname AS tn,
				b.bname AS bn,
				a.iname AS n,
				a.imoney AS m,
				a.iday AS d,
				a.itime AS t
			FROM
				aa_income a
			LEFT JOIN aa_big_type b ON b.id = a.bid
			WHERE
				DATE_FORMAT(a.iday, '%Y-%m') = '$aday_'
			UNION
				SELECT
					a.id,
					s.id AS tid,
					b.id AS bid,
					b.btype AS tt,
					b.bname AS bn,
					s.sname AS tn,
					a.aname AS n,
					a.amoney AS m,
					a.aday AS d,
					a.atime AS t
				FROM
					aa_account_book a
				LEFT JOIN aa_small_type s ON a.sid = s.id
				LEFT JOIN aa_big_type b ON b.id = s.bid
				WHERE
					DATE_FORMAT(a.aday, '%Y-%m') = '$aday_'
				ORDER BY
					d DESC,
					t DESC ";
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
	public function delete($id_) {
		$this -> id = $id_;
		$re=mysqli_query($this-> con,"DELETE FROM `aa_account_book` WHERE id='$this->id'");
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed DELETE account_book');
		}else{
			$json_data = array('tip' => 0, 'd' => 'DELETE failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updateDetail($id_,$aname_,$amoney_,$aday_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_account_book` SET `aname`='$aname_', `amoney`='$amoney_', `aday`='$aday_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE account_book type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'updateDetail failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updateType($id_,$sid_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_account_book` SET `sid`='$sid_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE account_book type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'updateType failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function insert($sid_, $aname_,$amoney,$aday_) {
		$sql = "INSERT INTO aa_account_book (sid, aname,amoney,aday) VALUES ('$sid_', '$aname_','$amoney','$aday_')";
		$re = mysqli_query($this-> con, $sql);

		// 输出自动生成的 ID
		//$nid = mysqli_insert_id($this-> con); 

		if($re){
			
			//mysqli_query($this->con,"UPDATE aa_big_type SET bpx = '$nid' WHERE id='$nid' ");
			$json_data = array('tip' => 1, 'd' => 'Succeed insert account_book ');
		} else {

			$json_data = array('tip' => 0, 'd' => 'Insert failed','re'=>$sql);
		}
		echo json_encode($json_data);
	}



}
?>