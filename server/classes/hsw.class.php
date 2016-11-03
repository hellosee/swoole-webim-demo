<?php
class hsw {
	private $serv = null;
	public function __construct(){
		File::init();
		$this->serv = new swoole_websocket_server("0.0.0.0",9501);
		$this->serv->set(array(
			'task_worker_num'     => 8
		));
		$this->serv->on("open",array($this,"onOpen"));
		$this->serv->on("message",array($this,"onMessage"));
		$this->serv->on("Task",array($this,"onTask"));
		$this->serv->on("Finish",array($this,"onFinish"));
		$this->serv->on("close",array($this,"onClose"));
		$this->serv->start();
	}
	
	public function onOpen( $serv , $request ){
		$data = array(
					'task' => 'open',
					'fd' => $request->fd
				);
		$this->serv->task( json_encode($data) );
		echo "open\n";
	}
	
	public function onMessage( $serv , $frame ){
		$data = json_decode( $frame->data , true );
		switch($data['type']){
			case 1://登录
				$data = array(
					'task' => 'login',
					'params' => array(
							'name' => $data['name'],
							'email' => $data['email']
						),
					'fd' => $frame->fd,
					'roomid' =>$data['roomid']
				);
				if(!$data['params']['name'] || !$data['params']['email'] ){
					$data['task'] = "nologin";
					$this->serv->task( json_encode($data) );
					break;
				}
				$this->serv->task( json_encode($data) );
				break;
			case 2: //新消息
				$data = array(
					'task' => 'new',
					'params' => array(
							'name' => $data['name'],
							'avatar' => $data['avatar']
						),
					'c' => $data['c'],
					'message' => $data['message'],
					'fd' => $frame->fd,
					'roomid' => $data['roomid']
				);
				$this->serv->task( json_encode($data) );
				break;
			case 3: // 改变房间
				$data = array(
					'task' => 'change',
					'params' => array(
						'name'   => $data['name'],
						'avatar' => $data['avatar'],
					),
					'fd' => $frame->fd,
					'oldroomid' => $data['oldroomid'],
					'roomid' => $data['roomid']
				);
				
				$this->serv->task( json_encode($data) );
				
				break;
			default :
				$this->serv->push($frame->fd, json_encode(array('code'=>0,'msg'=>'type error')));
		}
	}
	public function onTask( $serv , $task_id , $from_id , $data ){
		$pushMsg = array('code'=>0,'msg'=>'','data'=>array());
		$data = json_decode($data,true);
		switch( $data['task'] ){
			case 'open':
				$pushMsg = Chat::open( $data );
				$this->serv->push( $data['fd'] , json_encode($pushMsg) );
				return 'Finished';
			case 'login':
				$pushMsg = Chat::doLogin( $data );
				break;
			case 'new':
				$pushMsg = Chat::sendNewMsg( $data );
				break;
			case 'logout':
				$pushMsg = Chat::doLogout( $data );
				break;
			case 'nologin':
				$pushMsg = Chat::noLogin( $data );
				$this->serv->push( $data['fd'] ,json_encode($pushMsg));
				return "Finished";
			case 'change':
				$pushMsg = Chat::change( $data );
				break;
		}
		$this->sendMsg($pushMsg,$data['fd']);
		return "Finished";
	}
	
	public function onClose( $serv , $fd ){
		
		$pushMsg = array('code'=>0,'msg'=>'','data'=>array());
		//获取用户信息
		$user = Chat::logout("",$fd);
		if($user){
			$data = array(
				'task' => 'logout',
				'params' => array(
						'name' => $user['name']
					),
				'fd' => $fd
			);
			$this->serv->task( json_encode($data) );
		}
		
		echo "client {$fd} closed\n";
	}
	
	public function sendMsg($pushMsg,$myfd){
		foreach($this->serv->connections as $fd) {
			if($fd === $myfd){
				$pushMsg['data']['mine'] = 1;
			} else {
				$pushMsg['data']['mine'] = 0;
			}
			$this->serv->push($fd, json_encode($pushMsg));
		}
	}
	
	
	public function onFinish( $serv , $task_id , $data ){
		echo "Task {$task_id} finish\n";
        echo "Result: {$data}\n";
	}
}