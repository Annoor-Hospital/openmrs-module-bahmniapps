'use strict';

// Model not really necessary, just something like a type defenition
Bahmni.Common.Orders.RadiologyNote = function () {
    var create = function () {
        this.obsGroupUuid = '';
        this.obsNoteUuid = '';
        this.obsNote = null;
        this.obsExtUuid = '';
        this.obsExt = '';
        this.obsExtDate = '';
        this.obsNoteDatetime = '';
        this.obsProvider;
        this.obsProviderUuid;
    };
    create.apply(this, []);
};
