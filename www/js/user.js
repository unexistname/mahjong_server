
function initUsers(datas) {
	$("tbody tr").remove();
	for (var i = 0; i < datas.length; ++i) {
		var user = datas[i];
		var userDom = "<tr>";
		userDom += "<td>" + user.userId + "</td>";
		userDom += "<td>" + user.userName + "</td>";
		userDom += "<td>" + (user.sex == 0 ? "男" : "女") + "</td>";
		if (user.headImg) {
			userDom += `<td><image src="${user.headImg}" height="40px"/>` + "</td>";			
		} else {
			userDom += "<td>-</td>";
		}
		userDom += "<td>" + user.gems + "</td>";
		// userDom += "<td>" + user.coins + "</td>";
		// userDom += "<td>" + user.roomCard + "</td>";
		
		if (datas[i].total) {
			var win = datas[i].win;
			var total = datas[i].total;
			var winRate = Math.floor(win * 100 / total);//.toFixed(2);
			userDom += "<td>" + `${winRate}% (${win}/${total})` + "</td>";
		} else {
			userDom += "<td>" + "-" + "</td>";
		}
		if (datas[i].online) {
			userDom += "<td>在线</td>";
		} else {
			userDom += "<td>离线</td>";
		}
		
		userDom += "<td>" + formatDate(user.createTime) + "</td>";
		userDom += "<td>" + formatDate(user.lastLogin) + "</td>";
		userDom += "<td>" + `<a href="javascript: showRecord(${user.userId}, 0)">` + "战绩" + "</a>" + "</td>";
		
		if (user.isBlack == 1) {
			userDom += "<td>" + `<a href="javascript: setUserBlack(${user.userId}, 0)">` + "取消拉黑" + "</a>" + "</td>";
		} else {
			userDom += "<td>" + `<a href="javascript: setUserBlack(${user.userId}, 1)">` + "拉黑" + "</a>" + "</td>";
		}
		
		userDom += "</tr>";
		$("tbody").append($(userDom));
	}
}

function updateUserBlack(data) {
	var userId = data.userId;
	var black = data.black;
	
	var userDom;
	if (black == 1) {
		userDom = `<a href="javascript: setUserBlack(${userId}, 0)">` + "取消拉黑" + "</a>";
	} else {
		userDom = `<a href="javascript: setUserBlack(${userId}, 1)">` + "拉黑" + "</a>";
	}
	$("tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == userId) {
			$(domEle).children("td").last().html(userDom);
		}
	});
}

function setUserBlack(userId, black) {
	asyncGet("set_user_black", {userId: userId, black: black}, updateUserBlack);
}

function showRecord(userId) {
	window.location = "./record.html" + "?userId=" + userId;
}

$(function() {
	asyncGet("get_all_user_info", null, initUsers);
});

