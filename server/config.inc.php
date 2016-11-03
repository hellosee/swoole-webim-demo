<?php

error_reporting(E_ALL ^ E_NOTICE);
define("STORAGE","file"); //file 文件存储，mysql 数据库存储，redis 缓存存储
define("DOMAIN","http://192.168.56.133:8081");
define('ONLINE_DIR','/mnt/hgfs/swoole/chatroom/rooms/');

/*房间配置*/
$rooms = array(
	'a' => '唐',
	'b' => '伯',
	'c' => '虎',
	'd' => '点',
	'e' => '秋',
	'f' => '香'
);

?>