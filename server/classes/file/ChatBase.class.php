<?php

class ChatBase{
	public function __construct(array $options = array()){
		if(!empty($options)){
			foreach($options as $k=>$v){
				if(isset($this->$k)){
					$this->$k = $v;
				}
			}
		}
	}
}