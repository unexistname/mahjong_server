function ajaxFunction() {
   var xmlHttp;
   try{ // Firefox, Opera 8.0+, Safari
        xmlHttp=new XMLHttpRequest();
    }
    catch (e){
	   try{// Internet Explorer
	         xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
	      }
	    catch (e){
	      try{
	         xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
	      }
	      catch (e){}
	      }
    }
	return xmlHttp;
}

function asyncGet(action, argsDict, callback) {
	var xmlHttp=ajaxFunction();
	xmlHttp.onreadystatechange=function(){
		 if(xmlHttp.readyState==4){
		 	if(xmlHttp.status==200||xmlHttp.status==304){
				//接收服务器端返回的数据
				var data = xmlHttp.responseText;
				try {
					callback(JSON.parse(data));
				} catch (e) {
					console.log("json解析失败", data);
					callback(data);
				}
			}
		 }
	}
	var isFirst = true;
	var url = "../" + action;
	if (argsDict) {
		for (var key in argsDict) {
			url += isFirst ? "?" : "&";
			url += key + "=" + argsDict[key];
			isFirst = false;
		}
	}
	xmlHttp.open("get", url, true);
	xmlHttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xmlHttp.send();
}

function asyncPost(action, argsDict, callback) {
	var xmlHttp=ajaxFunction();
	xmlHttp.onreadystatechange=function(){
		 if(xmlHttp.readyState==4){
		 	if(xmlHttp.status==200||xmlHttp.status==304){
				//接收服务器端返回的数据
				var data = xmlHttp.responseText;
				try {
					callback(JSON.parse(data));
				} catch (e) {
					console.log("json解析失败", data);
					callback(data);
				}
			}
		 }
	}
	var formData = new FormData();
	if (argsDict) {	
		for (var key in argsDict) {
			formData.append(key, argsDict[key]);
		}
	}
	var url = "../" + action;
	xmlHttp.open("POST", url, true);
//	xmlHttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	xmlHttp.send(formData);
}

function formatDate(dateTime) {
	var date = new Date(parseInt(dateTime)); //转换成Data();
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	m = m < 10 ? '0' + m : m;
	var d = date.getDate();
	d = d < 10 ? ('0' + d) : d;
	return y + '-' + m + '-' + d;
}