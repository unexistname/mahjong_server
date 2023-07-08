
function initProps(datas) {
	$("#propTable tr").remove();
	console.log(datas);
	for (var i = 0; i < datas.length; ++i) {
		var prop = datas[i];
		var propDom = "<tr>";
		propDom += "<td>" + prop.id + "</td>";
		propDom += "<td>" + prop.propName + "</td>";
		propDom += "<td>" + prop.propDesc + "</td>";
		if (prop.imageUrl) {
			propDom += "<td>" + `<img src="${prop.imageUrl}" height="50px"/>` + "</td>";
		} else {
			propDom += "<td>" + "未设置图片" + "</td>";
		}
		propDom += "<td>";
		propDom += `<a href="javascript: modifyProp(${prop.id}, '${prop.propName}', '${prop.propDesc}', '${prop.imageUrl}')">修改</a>`;
		propDom += "&nbsp;&nbsp;";
		propDom += `<a href="javascript: deleteProp(${prop.id})">删除</a>`;
		
		propDom += "</td>";
		propDom += "</tr>";
		$("#propTable").append($(propDom));
	}
}

function initSeries(datas) {
	$("#seriesTable tr").remove();
	for (var i = 0; i < datas.length; ++i) {
		var series = datas[i];
		var seriesDom = "<tr>";
		seriesDom += "<td>" + series.id + "</td>";
		seriesDom += "<td>" + series.seriesName + "</td>";
		seriesDom += "<td>" + series.propId + "</td>";
		seriesDom += "<td>" + series.propAmount + "</td>";
		seriesDom += "<td>" + series.presentPrice + "</td>";
		seriesDom += "<td>";
		seriesDom += `<a href="javascript: modifySeries(${series.id}, '${series.seriesName}', '${series.propId}', '${series.propAmount}', '${series.presentPrice}')">修改</a>`;
		seriesDom += "&nbsp;&nbsp;";
		seriesDom += `<a href="javascript: deleteSeries(${series.id})">删除</a>`;
		seriesDom += "</td>";
		seriesDom += "</tr>";
		$("#seriesTable").append($(seriesDom));
	}
}

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

function addSeries() {
	window.location = "./mall_add_series.html" + "?time=" + new Date();
}

function modifySeries(seriesId, seriesName, propId, propAmount, presentPrice) {
	$("#seriesTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == seriesId) {
			var tdSeriesName = $(domEle).children("td")[1];
			$(tdSeriesName).html(`<input type="text" class="form-control" name="seriesName" value="${seriesName}" />`);
			
			var tdPropId = $(domEle).children("td")[2];
			$(tdPropId).html(`<input type="text" class="form-control" name="propId" value="${propId}" />`);
			
			var tdPropAmount = $(domEle).children("td")[3];
			$(tdPropAmount).html(`<input type="text" class="form-control" name="propAmount" value="${propAmount}"/>`);
			
			var tdPrice = $(domEle).children("td")[4];
			$(tdPrice).html(`<input type="text" class="form-control" name="presentPrice" value="${presentPrice}"/>`);
			
			var tdPropOp = $(domEle).children("td")[5];
			$(tdPropOp).html(`<a href="javascript: saveSeries(${seriesId})">保存</a>
				&nbsp;&nbsp;
				<a href="javascript: deleteSeries(${seriesId})">删除</a>`);
		}
	});
}

function saveSeries(seriesId){
	$("#seriesTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == seriesId) {
			var tdSeriesName = $(domEle).children("td")[1];
			var tdPropId = $(domEle).children("td")[2];
			var tdPropAmount = $(domEle).children("td")[3];
			var tdPrice = $(domEle).children("td")[4];
			var seriesName = $(tdSeriesName).children("input").val();
			var propId = $(tdPropId).children("input").val();
			var propAmount = $(tdPropAmount).children("input").val();
			var presentPrice = $(tdPrice).children("input").val();
			
			var data = {
				id: seriesId,
				seriesName: seriesName,
				propId: propId,
				propAmount: propAmount,
				presentPrice: presentPrice,
			};
			asyncGet("update_series", data, function() {
				var seriesDom = "";
				seriesDom += "<td>" + seriesId + "</td>";
				seriesDom += "<td>" + seriesName + "</td>";
				seriesDom += "<td>" + propId + "</td>";
				seriesDom += "<td>" + propAmount + "</td>";
				seriesDom += "<td>" + presentPrice + "</td>";
				seriesDom += "<td>";
				seriesDom += `<a href="javascript: modifySeries(${seriesId}, '${seriesName}', '${propId}', '${propAmount}', '${presentPrice}')">修改</a>`;
				seriesDom += "&nbsp;&nbsp;";
				seriesDom += `<a href="javascript: deleteSeries(${seriesId})">删除</a>`;
				seriesDom += "</td>";
			
				$(domEle).html(seriesDom);
			})
		}
	});
}

function saveCost(costId){
	$("#costTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == seriesId) {
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

function deleteSeries(seriesId) {
	asyncGet("delete_series", {seriesId: seriesId}, function(seriesId) {
		$("#seriesTable tr").each(function(index, domEle) {
			var td = $(domEle).children("td").first();
			if (td.html() == seriesId) {
				$(domEle).remove();
			}
		});
	});
}

function modifyProp(propId, propName, propDesc, imageUrl) {
	$("#propTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == propId) {
			var tdPropName = $(domEle).children("td")[1];
			$(tdPropName).html(`<input type="text" class="form-control" name="propName" value="${propName}" />`);
			
			var tdPropDesc = $(domEle).children("td")[2];
			$(tdPropDesc).html(`<input type="text" class="form-control" name="propDesc" value="${propDesc}" />`);
			
			var tdPropImage = $(domEle).children("td")[3];
			$(tdPropImage).html(`<input type="file" class="form-control" name="imageUrl" @change="javascript: uploadImage();"/>`);
			
			var tdPropOp = $(domEle).children("td")[4];
			$(tdPropOp).html(`<a href="javascript: saveProp(${propId}, encodeURI('${imageUrl}'))">保存</a>
				&nbsp;&nbsp;
				<a href="javascript: deleteProp(${propId})">删除</a>`);
		}
	});
}

function uploadImage() {
	console.log("准备上传文件")
}

function saveProp(propId, imageUrl){
	$("#propTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == propId) {
			var tdPropName = $(domEle).children("td")[1];
			var tdPropDesc = $(domEle).children("td")[2];
			var tdPropImage = $(domEle).children("td")[3];
			var propName = $(tdPropName).children("input").val();
			var propDesc = $(tdPropDesc).children("input").val();
			var propImage = $(tdPropImage).children("input")[0].files;
			console.log(imageUrl);
			if (propImage && propImage[0]) {
				imageUrl = "/img/" + propImage[0].name;
			}
			console.log(propName);
			console.log(propDesc);
			console.log(imageUrl);
			
			var propDom = "";
			propDom += "<td>" + propId + "</td>";
			propDom += "<td>" + propName + "</td>";
			propDom += "<td>" + propDesc + "</td>";
			if (imageUrl) {
				propDom += "<td>" + `<img src="${imageUrl}" height="50px"/>` + "</td>";
			} else {
				propDom += "<td>" + "未设置图片" + "</td>";
			}
			propDom += "<td>";
			propDom += `<a href="javascript: modifyProp(${propId}, '${propName}', '${propDesc}', '${imageUrl}')">修改</a>`;
			propDom += "&nbsp;&nbsp;";
			propDom += `<a href="javascript: deleteProp(${propId})">删除</a>`;
			
			propDom += "</td>";
			$(domEle).html(propDom);
		}
	});
}

function addProp() {
	window.location = "./mall_add_prop.html" + "?time=" + new Date();
}

function modifyCost(costId, gameType, costPropId, costPropAmount) {
	$("#costTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == propId) {
			var tdGameType = $(domEle).children("td")[1];
			$(tdGameType).html(`<input type="text" class="form-control" name="gameType" value="${gameType}" />`);
			
			var tdCostPropId = $(domEle).children("td")[2];
			$(tdCostPropId).html(`<input type="text" class="form-control" name="costPropId" value="${costPropId}" />`);
			
			var tdCostPropAmount = $(domEle).children("td")[2];
			$(tdCostPropAmount).html(`<input type="text" class="form-control" name="costPropAmount" value="${costPropAmount}" />`);
			
			var tdCostOp = $(domEle).children("td")[4];
			$(tdCostOp).html(`<a href="javascript: saveCost(${costId}))">保存</a>
				&nbsp;&nbsp;
				<a href="javascript: deleteCost(${costId})">删除</a>`);
		}
	});
}

function deleteProp(propId) {
	asyncGet("delete_prop", {propId: propId}, function(propId) {
		$("#propTable tr").each(function(index, domEle) {
			var td = $(domEle).children("td").first();
			if (td.html() == propId) {
				$(domEle).remove();
			}
		});
	})
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
	asyncGet("get_all_prop", null, initProps);
	asyncGet("get_all_series", null, initSeries);
	asyncGet("get_all_game_cost", null, initCost);
});
