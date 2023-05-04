<?php
class smallType {
	public $con;
	public $id;
	public $sname;
	public $bid;
	public $sshow;
	public $spx;
	public function __construct() {
		$connectSql = new sql();
		$this-> con = $connectSql-> con ;
// CREATE TABLE `aa_small_type` (
//   `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
//   `bid` int(11) unsigned DEFAULT NULL COMMENT '大类id',
//   `sname` text COMMENT '类名',
//   `sshow` tinyint(1) unsigned DEFAULT '1' COMMENT '1显示',
//   `spx` int(11) unsigned DEFAULT '0' COMMENT '排序',
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB DEFAULT CHARSET=gbk;




	}
	public function selectAll($btype_=2) {

		$result = mysqli_query($this-> con,"SELECT s.id,s.bid,b.btype as t,s.sname as n,b.bname as bn,s.sshow as s,s.spx as i From `aa_small_type` s LEFT JOIN `aa_big_type` b ON s.bid=b.id  WHERE b.btype = '$btype_' ORDER BY s.spx desc ");
		$d = array();
		if (mysqli_num_rows($result) > 0) {
			while ($row = mysqli_fetch_object($result)) {
				array_push($d, $row);
			}
			$json_data = array('tip' => 1, 'd' => $d);
		} else {
			$json_data = array('tip' => 0, 'd' =>  $d );
		}
		echo json_encode($json_data);
	}
	public function select($btype_=2) {

		$result = mysqli_query($this-> con,"SELECT s.id,s.bid,b.btype as t,s.sname as n,b.bname as bn,s.sshow as s,s.spx as i From `aa_small_type` s LEFT JOIN `aa_big_type` b ON s.bid=b.id  WHERE s.sshow = 1 AND b.btype = '$btype_' ORDER BY s.spx desc ");
		$d = array();
		if (mysqli_num_rows($result) > 0) {
			
			while ($row = mysqli_fetch_object($result)) {
				array_push($d, $row);
			}
			$json_data = array('tip' => 1, 'd' => $d);
		} else {
			$json_data = array('tip' => 0, 'd' =>  $d );
		}
		echo json_encode($json_data);
	}
	public function delete($id_) {
		$this -> id = $id_;
		$re=mysqli_query($this-> con,"DELETE FROM `aa_small_type` WHERE id='$this->id'");
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed DELETE small type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updatePX($id_,$spx_,$toEcho=1) {
		$this -> id = $id_;
		$sql="UPDATE `aa_small_type` SET `spx`='$spx_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE small type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		if($toEcho){
			echo json_encode($json_data);
		}
	}
	public function updateName($id_,$sname_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_small_type` SET `sname`='$sname_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE small type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function hide($id_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_small_type` SET `sshow`=0 WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE small type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function show($id_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_small_type` SET `sshow`=1 WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE small type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function insert($sname_, $bid_) {
		$sql = "INSERT INTO aa_small_type (sname, bid) VALUES ('$sname_', '$bid_')";
		$re = mysqli_query($this-> con, $sql);

		// 输出自动生成的 ID
		$nid = mysqli_insert_id($this-> con); 

		if($re){

			mysqli_query($this->con,"UPDATE aa_small_type SET spx = '$nid' WHERE id='$nid' ");

			$json_data = array('tip' => 1, 'd' => 'Succeed insert small type');
		} else {

			$json_data = array('tip' => 0, 'd' => 'Insert failed');
		}
		echo json_encode($json_data);
	}



}
?>