
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

function uploadImage() {
	console.log("准备上传文件")
}

$(function() {
	asyncGet("get_all_series", null, initSeries);
});
