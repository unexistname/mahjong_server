
function initRecords(datas) {
	$("#recordTable tr").remove();
	console.log(datas);
	for (var i = 0; i < datas.length; ++i) {
		var record = datas[i];
		var propDom = "<tr>";
		propDom += "<td>" + record.gameName + "</td>";
        
		propDom += "<td>";
        let conf = JSON.parse(record.roomConf);;
        if (conf) {
            let first = true;
            for (let key in conf) {
                let value = conf[key];
                if (typeof value != "boolean") {
                    value = key + "为" + value;
                } else {
                    value = key;
                }
                if (!first) {
                    propDom += ",";
                }
                first = false;
                propDom += value;
            }
        }
		propDom += "<td>";

		propDom += "<td>" + record.round + "</td>";
		propDom += "<td>" + formatDate(record.time) + "</td>";
		
		propDom += "<td>";
        propDom += `<div class="d-flex flex-wrap justify-content-xl-between">`;
        for (let user of record.users) {
            propDom += `<div class="d-none d-xl-flex border-md-right flex-grow-1 align-items-center justify-content-center p-2 item">
            <i class="mdi mdi-calendar-heart icon-lg mr-3 text-primary">
                <image src="${user.avatarUrl}" height="40px"/>
            </i>
            <div class="d-flex flex-column justify-content-around">
            <small class="mb-1 text-muted">${user.userName}</small>
            <div class="dropdown">
                <a class="btn btn-secondary p-0 bg-transparent border-0 text-dark shadow-none font-weight-medium" href="#">
                <h5 class="mb-0 d-inline-block">${user.score > 0 ? "+" + user.score : user.score}</h5>
                </a>
            </div>
            </div>
        </div>`;
        }
        propDom += `</div>`;
		
		propDom += "</td>";
		propDom += "</tr>";
		$("#recordTable").append($(propDom));
	}
}

$(function() {
    let userId = query.userId;
	asyncGet("get_all_record", {userId: userId}, initRecords);
});