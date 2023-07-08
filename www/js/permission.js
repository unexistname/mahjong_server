function initPermissions(datas) {
	$("tbody tr").remove();
	for (var i = 0; i < datas.length; ++i) {
		var user = datas[i];
		var userDom = "<tr>";
		userDom += "<td>" + user.userId + "</td>";
		userDom += "<td>" + user.userName + "</td>";
		userDom += "<td>" + (user.permission > 0 ? "管理员" : "普通用户") + "</td>";
		
		if (user.permission > 0) {
			userDom += "<td>" + `<a href="javascript: setUserPermission(${user.userId}, 0)">` + "移除权限" + "</a>" + "</td>";
		} else {
			userDom += "<td>" + `<a href="javascript: setUserPermission(${user.userId}, 1)">` + "添加权限" + "</a>" + "</td>";
		}
		userDom += "<td>" + user.gems + "</td>";
		userDom += "<td>" + `<input type="text"/><a href="javascript: addGem(${user.userId})">增加</a>` + "</td>";
		userDom += "</tr>";
		$("tbody").append($(userDom));
	}
}

function addGem(userId) {
	$("tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == userId) {
			var input = $(domEle).children("td").eq(5).children("input");
			var gemNum = parseInt(input.val());
			if (gemNum != null) {
				asyncGet("add_gem", {userId:userId, gem: gemNum}, function() {
					var oldGems = $(domEle).children("td").eq(4).html();
					var newGems = parseInt(oldGems) + gemNum;
					$(domEle).children("td").eq(4).html(newGems);
				});
			}
		}
	});
}

function setUserPermission(userId, permission) {
	asyncGet("set_user_permission", {userId: userId, permission: permission}, updateUserPermission);
}

function updateUserPermission(data) {
	var userId = data.userId;
	var permission = data.permission;
	
	var userDom;
	if (permission > 0) {
		userDom = `<a href="javascript: setUserPermission(${userId}, 0)">` + "移除权限" + "</a>";
	} else {
		userDom = `<a href="javascript: setUserPermission(${userId}, 1)">` + "添加权限" + "</a>";
	}
	$("tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == userId) {
			$(domEle).children("td").eq(3).html(userDom);
			$(domEle).children("td").eq(2).html((permission > 0 ? "管理员" : "普通用户"));
		}
	});
}

$(function() {
	asyncGet("get_all_user_permission", null, initPermissions);
});
