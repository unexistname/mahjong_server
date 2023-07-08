

function download() {
    var userAgent = navigator.userAgent;
    var isiOS = !!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
    var isAndroid = userAgent.indexOf('Android') > -1 || userAgent.indexOf('Adr') > -1;
    console.log('是否是Android：'+isAndroid);
    console.log('是否是iOS：'+isiOS);

    if (isiOS) {
        window.location.href = "itms-services://?action=download-manifest&url=https://ningdemajiang.cn/app/majiang.plist";
    } else {
        window.location.href = "http://106.55.237.13:8899/app/majiang.apk";
    }
}