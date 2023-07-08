
function addGameCost() {
	window.location = "./mall_add_game_cost.html" + "?time=" + new Date();
}

var gameTypeTable = {
	"pk_dx": "钓蟹",
	"wd_nn": "牛牛",
	"pk_zjh": "炸金花",
	"pk_sg": "三公",
	"pk_sss": "十三水",
	"pk_dz": "德州扑克",
	"mj_nd": "宁德麻将",
	"mj_fd": "福鼎麻将",
}

function initCost(datas) {
	$("#costTable tr").remove();
	for (var i = 0; i < datas.length; ++i) {
		var cost = datas[i];
		var costDom = "<tr>";
		costDom += "<td>" + cost.id + "</td>";
		costDom += "<td>" + (gameTypeTable[cost.gameType] ? gameTypeTable[cost.gameType] : cost.gameType) + "</td>";
		costDom += "<td>" + cost.costPropId + "</td>";
		costDom += "<td>" + cost.costPropAmount + "</td>";
		costDom += "<td>";
		costDom += `<a href="javascript: modifyCost(${cost.id}, '${cost.gameType}', '${cost.costPropId}', '${cost.costPropAmount}')">修改</a>`;
		costDom += "&nbsp;&nbsp;";
		costDom += `<a href="javascript: deleteCost(${cost.id})">删除</a>`;
		costDom += "</td>";
		costDom += "</tr>";
		$("#costTable").append($(costDom));
	}
}

function saveCost(costId){
	$("#costTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == costId) {
			var tdGameType = $(domEle).children("td")[1];
			var tdCostPropId = $(domEle).children("td")[2];
			var tdCostPropAmount = $(domEle).children("td")[3];
			var gameType = $(tdGameType).children("input").val();
			var propId = $(tdCostPropId).children("input").val();
			var propAmount = $(tdCostPropAmount).children("input").val();
			
			var data = {
				id: costId,
				gameType: gameType,
				costPropId: propId,
				costPropAmount: propAmount,
			};
			asyncGet("update_game_cost", data, function() {
				var costDom = "";
				costDom += "<td>" + costId + "</td>";
				costDom += "<td>" + (gameTypeTable[gameType] ? gameTypeTable[gameType] : gameType) + "</td>";
				costDom += "<td>" + propId + "</td>";
				costDom += "<td>" + propAmount + "</td>";
				costDom += "<td>";
				costDom += `<a href="javascript: modifyCost(${costId}, '${gameType}', '${propId}', '${propAmount}')">修改</a>`;
				costDom += "&nbsp;&nbsp;";
				costDom += `<a href="javascript: deleteCost(${costId})">删除</a>`;
				costDom += "</td>";
			
				$(domEle).html(costDom);
			})
		}
	});
}

function modifyCost(costId, gameType, costPropId, costPropAmount) {
	$("#costTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == costId) {
			var tdGameType = $(domEle).children("td")[1];
			$(tdGameType).html(`<input type="text" class="form-control" name="gameType" value="${(gameTypeTable[gameType] ? gameTypeTable[gameType] : gameType)}" />`);
			
			var tdCostPropId = $(domEle).children("td")[2];
			$(tdCostPropId).html(`<input type="text" class="form-control" name="costPropId" value="${costPropId}" />`);
			
			var tdCostPropAmount = $(domEle).children("td")[3];
			$(tdCostPropAmount).html(`<input type="text" class="form-control" name="costPropAmount" value="${costPropAmount}" />`);
			
			var tdCostOp = $(domEle).children("td")[4];
			$(tdCostOp).html(`<a href="javascript: saveCost(${costId})">保存</a>
				&nbsp;&nbsp;
				<a href="javascript: deleteCost(${costId})">删除</a>`);
		}
	});
}

function deleteCost(costId) {
	asyncGet("delete_game_cost", {costId: costId}, function(costId) {
		$("#costTable tr").each(function(index, domEle) {
			var td = $(domEle).children("td").first();
			if (td.html() == costId) {
				$(domEle).remove();
			}
		});
	})
}

$(function() {
	asyncGet("get_all_game_cost", null, initCost);
});
