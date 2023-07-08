
function initProps(datas) {
	$("#propTable tr").remove();
	console.log(datas);
	for (var i = 0; i < datas.length; ++i) {
		var prop = datas[i];
		var propDom = "<tr>";
		propDom += "<td>" + prop.id + "</td>";
		propDom += "<td>" + prop.propName + "</td>";
		propDom += "<td>" + prop.propDesc + "</td>";
		propDom += "<td>" + prop.costPropId + "</td>";
		propDom += "<td>" + prop.costAmount + "</td>";
		if (prop.imageUrl) {
			propDom += "<td>" + `<img src="${prop.imageUrl}" height="30px"/>` + "</td>";
		} else {
			propDom += "<td>" + "未设置图片" + "</td>";
		}
		propDom += "<td>";
		propDom += `<a href="javascript: modifyProp(${prop.id}, '${prop.propName}', '${prop.propDesc}', '${prop.costPropId}', '${prop.costAmount}', '${prop.imageUrl}')">修改</a>`;
		propDom += "&nbsp;&nbsp;";
		propDom += `<a href="javascript: deleteProp(${prop.id})">删除</a>`;
		
		propDom += "</td>";
		propDom += "</tr>";
		$("#propTable").append($(propDom));
	}
}

function modifyProp(propId, propName, propDesc, costPropId, costAmount, imageUrl) {
	$("#propTable tr").each(function(index, domEle) {
		var td = $(domEle).children("td").first();
		if (td.html() == propId) {
			var tdPropName = $(domEle).children("td")[1];
			$(tdPropName).html(`<input type="text" class="form-control" name="propName" value="${propName}" />`);
			
			var tdPropDesc = $(domEle).children("td")[2];
			$(tdPropDesc).html(`<input type="text" class="form-control" name="propDesc" value="${propDesc}" />`);
			
			var tdCostPropId = $(domEle).children("td")[3];
			$(tdCostPropId).html(`<input type="text" class="form-control" name="costPropId" value="${costPropId}" />`);
			
			var tdCostAmount = $(domEle).children("td")[4];
			$(tdCostAmount).html(`<input type="text" class="form-control" name="costAmount" value="${costAmount}" />`);
			
			var tdPropImage = $(domEle).children("td")[5];
			$(tdPropImage).html(`<input type="file" class="form-control" name="imageUrl" @change="javascript: uploadImage();"/>`);
			
			var tdPropOp = $(domEle).children("td")[6];
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
			var tdCostPropId= $(domEle).children("td")[3];
			var tdCostAmount= $(domEle).children("td")[4];
			var tdPropImage = $(domEle).children("td")[5];
			var propName = $(tdPropName).children("input").val();
			var propDesc = $(tdPropDesc).children("input").val();
			var costPropId = $(tdCostPropId).children("input").val();
			var costAmount = $(tdCostAmount).children("input").val();
			var propImage = $(tdPropImage).children("input")[0].files;

//			if (propImage && propImage[0]) {
//				imageUrl = "/img/" + propImage[0].name;
//			}
			
			var data = {
				id: propId,
				propName: propName,
				propDesc: propDesc,
				costPropId: costPropId,
				costAmount: costAmount,
			};
			if (propImage && propImage[0]) {
				data.imageUrl = propImage[0];
			}
			
			
			asyncPost("update_prop", data, function() {
				var propDom = "";
				propDom += "<td>" + propId + "</td>";
				propDom += "<td>" + propName + "</td>";
				propDom += "<td>" + propDesc + "</td>";
				propDom += "<td>" + costPropId + "</td>";
				propDom += "<td>" + costAmount + "</td>";
				if (imageUrl) {
					propDom += "<td>" + `<img src="${imageUrl}" height="50px"/>` + "</td>";
				} else {
					propDom += "<td>" + "未设置图片" + "</td>";
				}
				propDom += "<td>";
				propDom += `<a href="javascript: modifyProp(${propId}, '${propName}', '${propDesc}', '${costPropId}', '${costAmount}', '${imageUrl}')">修改</a>`;
				propDom += "&nbsp;&nbsp;";
				propDom += `<a href="javascript: deleteProp(${propId})">删除</a>`;
				
				propDom += "</td>";
				$(domEle).html(propDom);
			})
			
		}
	});
}

function addProp() {
	window.location = "./mall_add_prop.html" + "?time=" + new Date();
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

$(function() {
	asyncGet("get_all_prop", null, initProps);
});
