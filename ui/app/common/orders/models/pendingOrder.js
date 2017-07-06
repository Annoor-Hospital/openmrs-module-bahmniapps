'use strict';

Bahmni.Common.Orders.PendingOrder = function () {
    var create = function () {
        this.label = '';
        this.provider = '';
        this.orderDate = '';
        this.orderNumber = '';
        this.orderuid = '';
    };

    this.mapOrder = function (order) {
        this.label = order.concept.shortName || order.concept.name;
        this.provider = order.provider;
        this.orderDate = new Date(order.orderDate);
        this.orderNumber = order.orderNumber;
        this.orderuid = order.orderUuid;
        return this;
    };

    create.apply(this, []);
};