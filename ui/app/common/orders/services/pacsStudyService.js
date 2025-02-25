'use strict';

angular.module('bahmni.common.orders')
    .factory('pacsStudyService', ['$http', '$filter', function ($http, $filter) {
        var getStudies = function (data) {
            var params = {};
            if (data.patientid) params.patientid = data.patientid;
            if (data.date) params.date = $filter('date')(data.date, 'yyyyMMdd');
            return $http.get(Bahmni.Common.Constants.pacsUrl, {
                params: params,
                withCredentials: false
            }).then(function (response) {
                var studies = [];
                if (response.data.length === 1 && response.data[0].error) {
                    console.error(response.data[0].error);
                } else {
                    for (var i = 0; i < response.data.length; i++) {
                        studies.push(mapToPacsStudy(response.data[i]));
                    }
                }
                return studies;
            });
        };

        // combine date and time DICOM strings to js Date.
        var dateFromDicomString = function (dpart, tpart) {
            var date;
            if (dpart && tpart) {
                date = moment(dpart + ' ' + tpart, 'YYYYMMDD HHmmss.SSS').toDate();
            } else if (dpart) {
                date = moment(dpart, 'YYYYMMDD').toDate();
            } else {
                console.error("Date parse failed: " + dpart + " " + tpart);
            }
            return date;
        };

        // Get value of tag in studyData if present, otherwise defval
        var getDcmValue = function (studyData, tag, defval) {
            return tag in studyData && "Value" in studyData[tag] ? studyData[tag].Value[0] : defval;
        };

        // parse value as name
        var getDcmName = function (studyData, tag, defval) {
            if (tag in studyData && "Value" in studyData[tag] && 'Alphabetic' in studyData[tag].Value[0]) {
                var names = studyData[tag].Value[0].Alphabetic;
                names = names.split('^');
                names.push(names.shift()); // put last name at the end
                names = names.filter(function (sect) { return sect.length > 0; });
                names = names.join(' ');
                if (names.length === 0) names = defval;
                return names;
            } else {
                return defval;
            }
        };

        // studyData is study dcm4che c-find result retrieved by pacsStudyService
        // TODO: map 00080090 (provider) in orm2dcm.xsl
        // tags: 00100020,00100010,00100030,00080050,00400254,00400255,00081030,00321060,00080090,00080020,00080030,0020000D,00201206
        var mapToPacsStudy = function (studyData) {
            var fo = new Bahmni.Common.Orders.PacsStudy();
            fo.patientid = getDcmValue(studyData, "00100020", "");
            fo.patientName = getDcmName(studyData, "00100010", "");
            var pDOB = getDcmValue(studyData, "00100030", null);
            if (pDOB) fo.patientBirthDate = dateFromDicomString(pDOB);
            fo.accessionNumber = getDcmValue(studyData, "00080050", '');
            fo.label = getDcmValue(studyData, "00400254", "");
            if (!fo.label) fo.label = getDcmValue(studyData, "00400255", "");
            if (!fo.label) fo.label = getDcmValue(studyData, "00081030", "");
            if (!fo.label) fo.label = getDcmValue(studyData, "00321060", "image");
            fo.provider = getDcmName(studyData, "00080090", "");
            var sDate = getDcmValue(studyData, "00080020", null);
            var sTime = getDcmValue(studyData, "00080030", null);
            fo.orderDate = dateFromDicomString(sDate, sTime);
            fo.studyUid = getDcmValue(studyData, "0020000D", "");
            fo.seriesCount = getDcmValue(studyData, "00201206", "1");
            // the following does not follow dicom spec (see part 5 chapter 9 of Dicom 2013)
            /** In stock bahmni, the order number matches the accession number.
             *  This is not desirable for our implementation. A few options could
             *  have been:
             *  - Use study comments (0032,4000)
             *  - Use a custom DICOM tag (0009,xxxx)
             *  - Tag (0020,0010) (study id) seems to be unsued, but it isn't meant for order number */
            var orderNumberMatch = fo.studyUid.match(/\.([0-9]+)\.[0-9]+$/);
            if (orderNumberMatch) fo.orderNumber = "ORD-" + orderNumberMatch[1];
            return fo;
        };

        return {
            getStudies: getStudies
        };
    }]);
