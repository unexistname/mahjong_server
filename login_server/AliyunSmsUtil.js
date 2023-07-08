const Core = require('@alicloud/pop-core');

var AliyunSmsUtil = {
    sendMessage: function(data, callback) {

        var client = new Core({
            accessKeyId: 'LTAI5tRDvtJiwccFMgSoiPD6',
            accessKeySecret: 'SQi7oApR6H2JKNK2sPxb8boBo8es4o',
            // securityToken: '<your-sts-token>', // use STS Token
            endpoint: 'https://dysmsapi.aliyuncs.com',
            apiVersion: '2017-05-25'
        });

        var params = {
            "PhoneNumbers": data.phone,
            "SignName": "智动一刻",
            "TemplateCode": "SMS_219575248",
            "TemplateParam": '{"code":"' + data.code + '"}'
        }

        var requestOption = {
            method: 'POST',
            formatParams: false,
        };

        client.request('SendSms', params, requestOption).then((result) => {
            callback(null, JSON.stringify(result));
        }, (ex) => {
            callback(ex);
        })
    }
}

module.exports = AliyunSmsUtil;