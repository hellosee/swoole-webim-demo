<?php

class ChatUser extends ChatBase {
	
	protected $fd=0,$name = '', $avatar = '',$email='',$roomid='a';
	
	public function save(){
		$time = time();
		$return = File::login($this->roomid,$this->fd,array('fd'=>$this->fd,'name'=>$this->name,'avatar'=>$this->avatar,'email'=>$this->email,'time'=>date("H:i",time())));
		return $return;
	}
	
	public function getOnlineUsers(){
		$users = File::getOnlineUsers();
		return $users;
	}
	
	public function getUsers($roomid,$lists){
		$users = File::getUsers($roomid,$lists);
		return $users;
	}
	public function getUsersByRoom($roomid){
		$lists = File::getUsersByRoom($roomid);
		$info = $this->getUsers($roomid,array_slice($lists, 0, 100));
		return $info;
	}
	
	public function getUser( $roomid ,$fd ){
		$user = File::getUser( $roomid , $fd );
		return $user;
	}
	
	public function changeUser($oldroomid,$fd,$newroomid){
		$return = File::changeUser($oldroomid,$fd,$newroomid);
		return $return;
	}
	
}