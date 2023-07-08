
function initOrders(datas) {
	$("tbody tr").remove();
	for (var i = 0; i < datas.length; ++i) {
		var order = datas[i];
		var orderDom = "<tr>";
		orderDom += "<td>" + order.orderId + "</td>";
		orderDom += "<td>" + order.userId+ "</td>";
		orderDom += "<td>" + order.rechargeId + "</td>";
		orderDom += "<td>" + (order.state == "0" ? "未付款" : "已付款") + "</td>";
		orderDom += "<td>" + (order.payMoney ? order.payMoney : "未支付") + "</td>";
		orderDom += "<td>" + formatDate(order.createTime) + "</td>";
		orderDom += "<td>" + (order.payTime ? formatDate(order.payTime) : "-") + "</td>";		
		orderDom += "</tr>";
		$("tbody").append($(orderDom));
	}
}

$(function() {
	asyncGet("get_all_order", null, initOrders);
});