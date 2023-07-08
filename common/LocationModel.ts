

export default class LocationModel {
    longitude: number;
    latitude: number;
    city: string;

    private static getDistanceImpl(lat1: number, lng1: number, lat2: number, lng2: number){
        // 地球平均半径
        const EARTH_RADIUS = 6378137;
        // 把经纬度转为度（°）
        // 纬度
        let degree_lat1 = (lat1 * Math.PI) / 180.0;
        let degree_lat2 = (lat2 * Math.PI) / 180.0;
        let a = degree_lat1 - degree_lat2;
        // 经度
        let degree_lng1 = (lng1 * Math.PI) / 180.0;
        let degree_lng2 = (lng2 * Math.PI) / 180.0;
        let b = degree_lng1 - degree_lng2;
        // 距离 （单位：米）
        let s =
          2 *
          Math.asin(
            Math.sqrt(
              Math.pow(Math.sin(a / 2), 2) +
                Math.cos(degree_lat1) *
                  Math.cos(degree_lat2) *
                  Math.pow(Math.sin(b / 2), 2)
            )
          );
        s = s * EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000;
        return s;
    }

    static getDistance(location1: LocationModel, location2: LocationModel) {
        if (location1 == null || location2 == null) {
            return;
        }
        return this.getDistanceImpl(location1.latitude, location1.longitude, location2.latitude, location2.longitude);
    }
}