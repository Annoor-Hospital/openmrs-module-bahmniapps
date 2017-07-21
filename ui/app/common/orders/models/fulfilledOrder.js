'use strict';

Bahmni.Common.Orders.FulfilledOrder = function () {
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

    var create = function () {
        this.patientid = '';
        this.patientName = '';
        this.accessionNumber = '';
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.studyuid = '';
        this.orderNumber = '';
        this.orderuid = '';
        this.obsEncounter = null;
    };

    // study is object retrieved by pacsService via pacsQuery module
    this.mapStudy = function (study) {
        this.patientid = getDcmValue(study, "00100020", "");
        // prepend MAF if no prefix present
        //if (this.patientid.match(/^[0-9]+/)) {
        //    this.patientid = "MAF" + this.patientid;
        //}
        this.patientName = getDcmName(study, "00100010", "");
        this.accessionNumber = getDcmValue(study, "00080050", '');
        this.label = getDcmValue(study, "00321060", "X-Ray");
        this.provider = "Unknown";
        var sDate = getDcmValue(study, "00080020", null);
        var sTime = getDcmValue(study, "00080030", null);
        this.orderDate = dateFromString(sDate, sTime);
        this.studyuid = getDcmValue(study, "0020000D", "");
        // use part of study uid to get orderNumber!!! (hack)
        // this.orderNumber = getDcmValue(study, "00402016", "");
        var onMatch = this.studyuid.match(/\.([0-9]+)\.[0-9]+$/);
        if(onMatch) {
            this.orderNumber = "ORD-" + onMatch[1];
        }
        return this;
    };

    this.combineWithOrder = function (pendingOrder) {
        this.label = pendingOrder.label;
        this.provider = pendingOrder.provider;
        this.orderuid = pendingOrder.orderuid;
        return this;
    };

    this.hasStudyuid = function () {
        return this.studyuid && this.studyuid.length > 0;
    }

    this.hasObsNote = function () {
        return this.obsNote && this.obsNote.length > 0;
    }

    create.apply(this, []);
};
