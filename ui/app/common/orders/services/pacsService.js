'use strict';

angular.module('bahmni.common.orders')
    .factory('pacsService', ['$http', '$filter', function ($http, $filter) {
        
        var getStudies = function (data) {
            var params = {};
            if (data.patientid) params.patientid = data.patientid;
            if (data.date) params.date = $filter('date')(data.date, 'yyyyMMdd');
            return $http.get(Bahmni.Common.Constants.pacsUrl, {
                params: params,
                withCredentials: false
            }).then(function (response) {
                var studies = [];
                for (var i = 0; i < response.data.length; i++) {
                    studies.push(mapToFullfilledOrder(response.data[i]));
                }
                return studies;
            });
        };

        var dateFromString = function (dpart, tpart) {
            var date;
            if(dpart && tpart) {
                date = moment(dpart + ' ' + tpart, 'YYYYMMDD HHmmss.SSS').toDate();
            } else if(dpart) {
                date = moment(dpart, 'YYYYMMDD').toDate();
            } else {
                console.error("Date parse failed: " + dpart + " " + tpart);
            }
            return date;
        }

        var getDcmValue = function (study, tag, defval) {
            return tag in study && "Value" in study[tag] ? study[tag].Value[0] : defval;
        };

        var getDcmName = function (study, tag, defval) {
            if (tag in study && "Value" in study[tag] && 'Alphabetic' in study[tag].Value[0]) {
                var names = study[tag].Value[0].Alphabetic;
                names = names.split('^');
                names.push(names.shift()); // put last name at the end ??
                names = names.filter(function (sect) { return sect.length > 0; });
                names = names.join(' ');
                if (names.length == 0) names = defval;
                return names;
            } else {
                return defval;
            }
        };

        // study is object retrieved by pacsService via pacsQuery module
        var mapToFullfilledOrder = function (study) {
            var fo = new Bahmni.Common.Orders.FulfilledOrder();
            fo.patientid = getDcmValue(study, "00100020", "");
            // prepend MAF if no prefix present
            //if (this.patientid.match(/^[0-9]+/)) {
            //    this.patientid = "MAF" + this.patientid;
            //}
            fo.patientName = getDcmName(study, "00100010", "");
            fo.accessionNumber = getDcmValue(study, "00080050", '');
            fo.label = getDcmValue(study, "00321060", "X-Ray");
            fo.provider = "Unknown";
            var sDate = getDcmValue(study, "00080020", null);
            var sTime = getDcmValue(study, "00080030", null);
            fo.orderDate = dateFromString(sDate, sTime);
            fo.studyuid = getDcmValue(study, "0020000D", "");
            // use part of study uid to get orderNumber!!! (hack)
            // this.orderNumber = getDcmValue(study, "00402016", "");
            var onMatch = fo.studyuid.match(/\.([0-9]+)\.[0-9]+$/);
            if(onMatch) {
                fo.orderNumber = "ORD-" + onMatch[1];
            }
            return fo;
        };

        return {
            getStudies: getStudies
        };
    }]);
