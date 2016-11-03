<?php
class File {
	private static $instance;
	protected $online_dir;
    protected $history = array();
    protected $history_max_size = 100;
    protected $history_write_count = 0;
	
	private function __construct() {
		global $rooms;
        $this->online_dir = ONLINE_DIR;
		foreach($rooms as $_k => $_v){
			$this->checkDir($this->online_dir.$_k.'/', true);
		}
    }
	public static function init(){
		if(self::$instance instanceof self){
			return false;
		}
		self::$instance = new self();
	}
	
	public static function clearDir($dir) {
        $n = 0;
        if ($dh = opendir($dir)) {
            while (($file = readdir($dh)) !== false) {
                if ($file == '.' or $file == '..') {
                    continue;
                }
                if (is_file($dir . $file)) {
                    unlink($dir . $file);
                    $n++;
                }
                if (is_dir($dir . $file)) {
                    self::clearDir($dir . $file . '/');
                    $n++;
                }
            }
        }
        closedir($dh);
        return $n;
    }
	
	public static function changeUser($oldroomid,$fd,$newroomid){
		$old = self::$instance->online_dir.$oldroomid.'/'.$fd;
		$new = self::$instance->online_dir.$newroomid.'/'.$fd;
		$return = copy($old,$new); //拷贝到新目录
		unlink($old); //删除旧目录下的文件
		return $return;
	}
	
	public static function checkDir($dir, $clear_file = false) {
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0777, true)) {
                rw_deny:
                trigger_error("can not read/write dir[".$dir."]", E_ERROR);
                return;
            }
        }  else if ($clear_file) {
           self::clearDir($dir);
        }
    }
	//登录
	public static function login($roomid,$fd, $info){
		$flag = @file_put_contents(self::$instance->online_dir.$roomid.'/'.$fd, @serialize($info));
		return $flag;
    }
	/**
	 * 获取所有房间的在线用户
	 */
	public static function getOnlineUsers(){
		global $rooms;
		$online_users = array();
		foreach($rooms as $_k => $_v){
			$online_users[$_k] = array_slice(scandir(self::$instance->online_dir.$_k.'/'), 2);
		}
        return $online_users;
    }
	
	public static function getUsersByRoom($roomid){
		$users = array_slice(scandir(self::$instance->online_dir.$roomid.'/'), 2);
		return $users;
	}
	
	public static function getUsers($roomid,$users) {
        $ret = array();
        foreach($users as $v){
            $ret[] = self::getUser($roomid,$v);
        }
        return $ret;
    }
	
	public static function getUser($roomid,$userid) {
		if($roomid == ""){
			global $rooms;
			foreach($rooms as $_k => $_v){
				if(file_exists(self::$instance->online_dir.$_k.'/'.$userid)){
					$roomid = $_k;
					break;
				}
			}
		}
        if (!is_file(self::$instance->online_dir.$roomid.'/'.$userid)) {
            return false;
        }
        $ret = @file_get_contents(self::$instance->online_dir.$roomid.'/'.$userid);
        $info = @unserialize($ret);
		$info['roomid'] = $roomid;//赋予用户所在的房间
        return $info;
    }
	public static function logout($userid) {
		global $rooms;
		foreach($rooms as $_k => $_v){
			if(self::exists($_k,$userid)){
				unlink(self::$instance->online_dir.$_k.'/'.$userid);
				break;
			}
		}
		
    }
	
	public static function exists($roomid,$userid){
		if(file_exists(self::$instance->online_dir.$roomid.'/'.$userid)){
			 return is_file(self::$instance->online_dir.$roomid.'/'.$userid);
		}
		return false;
    }
}