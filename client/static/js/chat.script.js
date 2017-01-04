$(document).ready(function(){
	// Run the init method on document ready:
	face.init();
	chat.init();
	
});
var chat = {
	data : {
		wSock       : null,
		login		: false,
		storage     : null,
		type	    : 1,
		fd          : 0,
		name        : "",
		email       : "",
		avatar      : "",
		rds         : [],//所有房间ID
		crd         : 'a', //当前房间ID
		remains     : []
	},
	init : function (){
		this.copyright();
		this.off();
		chat.data.storage = window.localStorage;
		this.ws();
	},
	doLogin : function( name , email ){
		if(name == '' || email == ''){
			name =  $("#name").val();
			email = $('#email').val();
		}
		name = $.trim(name) ;
		email = $.trim(email) ;
		if(name == "" || email == ""){
			chat.displayError('chatErrorMessage_logout',"请输入昵称和Email才可以参与群聊哦～",1);
			return false;
		}
		var  re = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
		if(!re.test(email)){
			chat.displayError('chatErrorMessage_logout',"逗我呢，邮箱长成这样子？？",1);
			return false;
		}
		//登录操作
		chat.data.type = 1; //登录标志
		chat.data.email = email; //邮箱
		chat.data.login = true;
		var json = {"type": chat.data.type,"name": name,"email": email,'roomid':'a'};
		chat.wsSend(JSON.stringify(json));
		return false;
		 
	},
	logout : function(){
		if(!this.data.login) return false;
		chat.data.type = 0;
		chat.data.storage.removeItem('dologin');
		chat.data.storage.removeItem('name');
		chat.data.storage.removeItem('email');
		chat.data.fd = '';
		chat.data.name = '';
		chat.data.avatar = '';
		location.reload() ;
	},
	keySend : function( event ){
		if (event.ctrlKey && event.keyCode == 13) {
			$('#chattext').val($('#chattext').val() +  "\r\n");
		}else if( event.keyCode == 13){
			event.preventDefault();//避免回车换行
			this.sendMessage();
		}
	},
	sendMessage : function(){		
		if(!this.data.login) return false;
		//发送消息操作
		var text = $('#chattext').val();
		if(text.length == 0) return false;
		chat.data.type = 2; //发送消息标志
		var json = {"type": chat.data.type,"name": chat.data.name,"avatar": chat.data.avatar,"message": text,"c":'text',"roomid":this.data.crd};
		chat.wsSend(JSON.stringify(json));
		return true;
	},
	ws : function(){
		this.data.wSock = new WebSocket(config.wsserver);
		this.wsOpen();
		this.wsMessage();
		this.wsOnclose();
		this.wsOnerror();
	},
	wsSend : function(data){
		this.data.wSock.send(data);
	},
	wsOpen : function (){
		this.data.wSock.onopen = function( event ){
			//初始化房间
			chat.print('wsopen',event);
			//判断是否已经登录过，如果登录过。自动登录。不需要再次输入昵称和邮箱
			/*
			var isLogin = chat.data.storage.getItem("dologin");
			if( isLogin ) {
				var name =  chat.data.storage.getItem("name");
				var email =  chat.data.storage.getItem("email");
				chat.doLogin( name , email );
			}
			*/
			
		}
	},
	wsMessage : function(){
		this.data.wSock.onmessage=function(event){
			var d = jQuery.parseJSON(event.data);
			switch(d.code){
				case 1:
					if(d.data.mine){
						chat.data.fd = d.data.fd;
						chat.data.name = d.data.name;
						chat.data.avatar = d.data.avatar;
						chat.data.storage.setItem("dologin",1);
						chat.data.storage.setItem("name",d.data.name);
						chat.data.storage.setItem("email",chat.data.email);
						document.title = d.data.name + '-' + document.title;
						chat.loginDiv(d.data);
					} 
					chat.addChatLine('newlogin',d.data,d.data.roomid);
					chat.addUserLine('user',d.data);
					chat.displayError('chatErrorMessage_login',d.msg,1);
					break;
				case 2:
					if(d.data.mine){
						chat.addChatLine('mymessage',d.data,d.data.roomid);
						$("#chattext").val('');
					} else {
						if(d.data.remains){
							for(var i = 0 ; i < d.data.remains.length;i++){
								if(chat.data.fd == d.data.remains[i].fd){
									chat.shake();
									var msg = d.data.name + "在群聊@了你。";
									chat.displayError('chatErrorMessage_logout',msg,0);
								}
							}
						}
						chat.chatAudio();
						chat.addChatLine('chatLine',d.data,d.data.roomid);
						//增加消息
						chat.showMsgCount(d.data.roomid,'show');
					}
					break;
				case 3:
					chat.removeUser('logout',d.data);
					if(d.data.mine && d.data.action == 'logout'){
						
						return;
					}
					chat.displayError('chatErrorMessage_logout',d.msg,1);
					break;
				case 4: //页面初始化
					chat.initPage(d.data);
					break;
				case 5:
					if(d.data.mine){
						chat.displayError('chatErrorMessage_logout',d.msg,1);
					}
					break;
				case 6:
					if(d.data.mine){
						//如果是自己
						
					} else {
						//如果是其他人
						
					}
					//删除旧房间该用户
					chat.changeUser(d.data);
					chat.addUserLine('user',d.data);
					break;
				default :
					chat.displayError('chatErrorMessage_logout',d.msg,1);
			}
		}
	},
	wsOnclose : function(){
		this.data.wSock.onclose = function(event){
		}
	},
	wsOnerror : function(){
		this.data.wSock.onerror = function(event){
			//alert('服务器关闭，请联系QQ:1335244575 开放测试2');
		}
	},
	showMsgCount:function(roomid,type){
		if(!this.data.login) {return;}
		if(type == 'hide'){
			$("#message-"+roomid).text(parseInt(0));
			$("#message-"+roomid).css('display','none');
		} else {
			if(chat.data.crd != roomid){
				$("#message-"+roomid).css('display','block');
				var msgtotal = $("#message-"+roomid).text();
				$("#message-"+roomid).text(parseInt(msgtotal)+1);
			}
		}
	},
	/** 
	 * 当一个用户进来或者刷新页面触发本方法
	 *
	 */
	initPage:function( data ){
		this.initRooms( data.rooms );
		this.initUsers( data.users );
	},
	/**
	 * 填充房间用户列表
	 */
	initUsers : function( data ){
		if(getJsonLength(data)){
			for(var item in data){
				var users = [];
				var len = data[item].length;
				if(len){
					for(var i = 0 ; i < len ; i++){
						if(data[item][i]){
							users.push(cdiv.render('user',data[item][i]));
						}
					}
				}
				$('#conv-lists-' + item).html(users.join(''));
			}
		}
	},
	/**
	 * 1.初始化房间
	 * 2.初始化每个房间的用户列表
	 * 3.初始化每个房间的聊天列表
	 */
	initRooms:function(data){
		var rooms = [];//房间列表
		var userlists = [];//用户列表
		var chatlists = [];//聊天列表
		if(data.length){
			var display = 'none';
			for(var i=0; i< data.length;i++){
				if(data[i]){
					//存储所有房间ID
					this.data.rds.push(data[i].roomid);
					data[i].selected = '';
					if(i == 0){ 
						data[i].selected = 'selected';
						this.data.crd = data[i].roomid; //存储第一间房间ID，自动设为默认房间ID
						display = 'block';//第一间房的用户列表和聊天记录公开
					} 
					//初始化每个房间的用户列表
					userlists.push(cdiv.userlists(data[i].roomid,display));
					//初始化每个房间的聊天列表
					chatlists.push(cdiv.chatlists(data[i].roomid,display));
					//创建所有的房间
					rooms.push(cdiv.render('rooms',data[i]));
					display = 'none';
				}
			}
			$('.main-menus').html(rooms.join(''));
			$("#user-lists").html(userlists.join(''));
			$("#chat-lists").html(chatlists.join(''));
		}
	},
	loginDiv : function(data){
		/*设置当前房间*/
		this.data.crd = data.roomid;
		/*显示头像*/
		$('.profile').html(cdiv.render('my',data));
		$('#loginbox').fadeOut(function(){
			$('.input-area').fadeIn();
			$('.action-area').fadeIn();
			$('.input-area').focus();
		});
	},
	changeRoom : function(obj){
		//未登录
		if(!this.data.login) {
			this.shake();
			chat.displayError('chatErrorMessage_logout',"未登录用户不能查看房间哦～",1);
			return false;
		}
		var roomid = $(obj).attr("roomid");
		var userObj = $("#conv-lists-"+roomid).find('#user-'+this.data.fd);
		if(userObj.length > 0){
			return;
		}
		
		$("#main-menus").children().removeClass("selected");
		$("#user-lists").children().css("display","none");

		$("#chat-lists").children().css("display","none");
		$("#conv-lists-" + roomid).css('display',"block");
		$(obj).addClass('selected');
		$("#chatLineHolder-" + roomid).css('display',"block");
		var oldroomid = this.data.crd;
		//设置当前房间
		this.data.crd = roomid;
		//用户切换房间
		this.data.type = 3;//改变房间
		var json = {"type": chat.data.type,"name": chat.data.name,"avatar": chat.data.avatar,"oldroomid":oldroomid,"roomid":this.data.crd};
		chat.wsSend(JSON.stringify(json));
		
	},
	
	// The addChatLine method ads a chat entry to the page
	
	addChatLine : function(t,params,roomid){
		var markup = cdiv.render(t,params);
		$("#chatLineHolder-"+roomid).append(markup);
		this.scrollDiv('chat-lists');
	},
	addUserLine : function(t,params){
		var markup = cdiv.render(t,params);
		$('#conv-lists-'+params.roomid).append(markup);
	},
	removeUser : function (t,params){ //type 1=换房切换，0=退出
		$("#user-"+params.fd).fadeOut(function(){
			$(this).remove();
			$("#chatLineHolder").append(cdiv.render(t,params));
		});
	},
	changeUser : function( data ){
		console.log(data);
		$("#conv-lists-"+data.oldroomid).find('#user-' + data.fd).fadeOut(function(){
			chat.showMsgCount(data.roomid,'hide');
			$(this).remove();
			//chat.addChatLine('logout',data,data.oldroomid);
		});
	},
	scrollDiv:function(t){
		var mai=document.getElementById(t);
		mai.scrollTop = mai.scrollHeight+100;//通过设置滚动高度
	},
	remind : function(obj){
		var msg = $("#chattext").val();
		$("#chattext").val(msg + "@" + $(obj).attr('uname') + "　");
	},
	
	// This method displays an error message on the top of the page:
	displayError : function(divID,msg,f){
		var elem = $('<div>',{
			id		: divID,
			html	: msg
		});
		
		elem.click(function(){
			$(this).fadeOut(function(){
				$(this).remove();
			});
		});
		if(f){
			setTimeout(function(){
				elem.click();
			},5000);	
		}
		elem.hide().appendTo('body').slideDown();
	},
	chatAudio : function(){
		if ( $("#chatAudio").length <= 0 ) {
			$('<audio id="chatAudio"><source src="./static/voices/notify.ogg" type="audio/ogg"><source src="./static/voices/notify.mp3" type="audio/mpeg"><source src="./static/voices/notify.wav" type="audio/wav"></audio>').appendTo('body');
		} 
		$('#chatAudio')[0].play();
	},
	shake : function(){
		$("#layout-main").attr("class", "shake_p");
		var shake = setInterval(function(){  
			$("#layout-main").attr("class", "");
			clearInterval(shake);
		},200);
	},
	off : function(){
		document.onkeydown = function (event){
			if ( event.keyCode==116){
				event.keyCode = 0;
				event.cancelBubble = true;
				return false;
			} 
		}
	},
	copyright:function(){
		console.log("您好！不介意的话可以加QQ讨论学习（1335244575）");
	},
	print:function(flag,obj){
		console.log('----' + flag + ' start-------');
		console.log(obj);
		console.log('----' + flag + ' end-------');
	}
}
