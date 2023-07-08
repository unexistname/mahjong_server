
$(function () {
	$(".nav-link").each(function(index, domEle) {
		$(domEle).click(function() {
			$(".nav-link.active").removeClass("active");
			$(domEle).addClass("active");
		})
	});
	
//document.getElementsByName('mainFrame')[0].height="100%";

});

function changeToStatisticsPage() {
	$("iframe").attr("src", "./statistics.html" + "?time=" + new Date());
}

function changeToUserPage() {
	$("iframe").attr("src", "./user.html" + "?time=" + new Date());
}

function changeToMallPage() {
	$("iframe").attr("src", "./mall.html" + "?time=" + new Date());
}

function changeToPropPage() {
	$("iframe").attr("src", "./prop.html" + "?time=" + new Date());
}

function changeToSeriesPage() {
	$("iframe").attr("src", "./series.html" + "?time=" + new Date());
}

function changeToGameCostPage() {
	$("iframe").attr("src", "./game_cost.html" + "?time=" + new Date());
}

function changeToOrderPage() {
	$("iframe").attr("src", "./order.html" + "?time=" + new Date());
}

function changeToPermissionPage() {
	$("iframe").attr("src", "./permission.html" + "?time=" + new Date());
}
