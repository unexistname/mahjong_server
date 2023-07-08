
function updateUserAmount() {
	asyncGet("get_user_amount", null, function(data) {
		$("#userAmount").html(data);
	});
}

function updatePayAmount() {
	asyncGet("get_total_order_pay", null, function(data) {
		$("#payAmount").html(data);
	});
}

function updateOnlineAmount() {
	asyncGet("get_online_user_amount", null, function(data) {
		$("#onlineAmount").html(data);
	});
}

$(function() {
	updateUserAmount();
	updatePayAmount();
	updateOnlineAmount();
});
