<?php

/**
 * 字符串防SQL注入编码，对GET,POST,COOKIE的数据进行预处理
 *
 * @param  $input 要处理字符串或者数组
 * @param  $urlencode 是否要URL编码
 */
function escape($input, $urldecode = 0) {
    if(is_array($input)){
        foreach($input as $k=>$v){
            $input[$k]=escape($v,$urldecode);
        }
    }else{
        $input=trim($input);
        if ($urldecode == 1) {
            $input=str_replace(array('+'),array('{addplus}'),$input);
            $input = urldecode($input);
            $input=str_replace(array('{addplus}'),array('+'),$input);
        }
        // PHP版本大于5.4.0，直接转义字符
        if (strnatcasecmp(PHP_VERSION, '5.4.0') >= 0) {
            $input = addslashes($input);
        } else {
            // 魔法转义没开启，自动加反斜杠
            if (!get_magic_quotes_gpc()) {
                $input = addslashes($input);
            }
        }
    }
    //防止最后一个反斜杠引起SQL错误如 'abc\'
    if(substr($input,-1,1)=='\\') $input=$input."'";//$input=substr($input,0,strlen($input)-1);
    return $input;
}