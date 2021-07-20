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
                if(response.data.length == 1 && response.data[0].error) {
                    console.error(response.data[0].error);
                } else {
                    for (var i = 0; i < response.data.length; i++) {
                        studies.push(mapToFullfilledOrder(response.data[i]));
                    }
                }
                return studies;
            });
        };

        var dateFromDicomString = function (dpart, tpart) {
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
            // if(fo.patientid.match(/^[0-9]+/) && parseInt(fo.patientid) > 200000) {
            //     fo.patientid = "MAF" + fo.patientid;
            // }
            fo.patientName = getDcmName(study, "00100010", "");
            var pDOB = getDcmValue(study, "00100030", null);
            if(pDOB) {
                fo.patientBirthDate = dateFromDicomString(pDOB);
            }
            fo.accessionNumber = getDcmValue(study, "00080050", '');
            fo.label = getDcmValue(study, "00400254", "");
            if(!fo.label)
                fo.label = getDcmValue(study, "00400255", "");
            if(!fo.label)
                fo.label = getDcmValue(study, "00081030", "");
            if(!fo.label)
                fo.label = getDcmValue(study, "00321060", "image");
            fo.provider = '';
            var sDate = getDcmValue(study, "00080020", null);
            var sTime = getDcmValue(study, "00080030", null);
            fo.orderDate = dateFromDicomString(sDate, sTime);
            fo.studyUid = getDcmValue(study, "0020000D", "");
            fo.seriesCount = getDcmValue(study, "00201206", "1");
            // use part of study uid to get orderNumber!!! (hack)
            // (Technically this may violate dicom spec, see chapter 9 of Dicom 2013)
            /*  The 'proper' solution here is to have bahmni generate
             *  the accession number, such that the accession number IS
             *  the order number. Then tag 00080050 can be referenced to
             *  match pacs images to orders in bahmni. However, at MAF
             *  we wanted to allow the accession number system to be
             *  able to continue even with the PACS system offline, so
             *  that accession numbers are not interrupted. This is why
             *  the accession numbers were made independant from bahmni.
             *  
             *  The suggested solution (online) is that when the pacs
             *  system is offline, x-rays can still be taken with a blank
             *  accession number, and these can be filled in at a later
             *  time.
             */
            // this.orderNumber = getDcmValue(study, "00402016", "");
            var onMatch = fo.studyUid.match(/\.([0-9]+)\.[0-9]+$/);
            if(onMatch) {
                fo.orderNumber = "ORD-" + onMatch[1];
            }
            return fo;
        };

        return {
            getStudies: getStudies
        };
    }]);
