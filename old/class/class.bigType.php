<?php
class bigType {
	public $con;
	public $id;
	public $bname;
	public $btype;
	public $bshow;
	public $bpx;
	public function __construct() {
		$connectSql = new sql();
		$this-> con = $connectSql-> con ;
// CREATE TABLE `aa_big_type` (
//   `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
//   `bname` text COMMENT '类名',
//   `btype` tinyint(1) unsigned DEFAULT '1' COMMENT '1收2支',
//   `bshow` tinyint(1) unsigned DEFAULT '1' COMMENT '1显示 0删除',
//   `bpx` int(11) unsigned DEFAULT '0' COMMENT '排序',
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB DEFAULT CHARSET=gbk;


	}
	public function selectAll($btype_=2) {

		$result = mysqli_query($this-> con,"SELECT id,btype as t, bname as n,bname as bn,bshow as s ,bpx as i From `aa_big_type` WHERE btype = '$btype_' ORDER BY bpx desc ");
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

		$result = mysqli_query($this-> con,"SELECT id,btype as t, bname as n,bname as bn,bshow as s ,bpx as i From `aa_big_type` WHERE bshow = 1 AND btype = '$btype_' ORDER BY bpx desc ");
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
		$re=mysqli_query($this-> con,"DELETE FROM `aa_big_type` WHERE id='$this->id'");
		
		if ($re==1 ) {			
			$small_typere=mysqli_query($this-> con,"DELETE FROM `aa_small_type` WHERE bid='$this->id'");
			if ($small_typere>0 ) {
				$json_data = array('tip' => 1, 'd' => 'Succeed DELETE 1 big type and DELETE '.$small_typere.' small types');
			}else{
				$json_data = array('tip' => 1, 'd' => 'Succeed DELETE 1 big type');
			}
			
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function updatePX($id_,$bpx_,$toEcho=1) {
		$this -> id = $id_;
		$sql="UPDATE `aa_big_type` SET `bpx`='$bpx_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE big type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		if($toEcho){
			echo json_encode($json_data);
		}
	}
	public function updateName($id_,$bname_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_big_type` SET `bname`='$bname_' WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE big type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function hide($id_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_big_type` SET `bshow`=0 WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE big type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function show($id_) {
		$this -> id = $id_;
		$sql="UPDATE `aa_big_type` SET `bshow`=1 WHERE `id`='$id_' ";
		$re = mysqli_query($this-> con, $sql);
		if ($re==1 ) {
			$json_data = array('tip' => 1, 'd' => 'Succeed UPDATE big type');
		}else{
			$json_data = array('tip' => 0, 'd' => 'Insert failed '+$re);
		}
		echo json_encode($json_data);
	}
	public function insert($bname_, $btype_) {
		$sql = "INSERT INTO aa_big_type (bname, btype) VALUES ('$bname_', '$btype_')";
		$re = mysqli_query($this-> con, $sql);

		// 输出自动生成的 ID
		$nid = mysqli_insert_id($this-> con); 

		if($re){
			
			mysqli_query($this->con,"UPDATE aa_big_type SET bpx = '$nid' WHERE id='$nid' ");
			$json_data = array('tip' => 1, 'd' => 'Succeed insert big type');
		} else {

			$json_data = array('tip' => 0, 'd' => 'Insert failed');
		}
		echo json_encode($json_data);
	}



}
?>