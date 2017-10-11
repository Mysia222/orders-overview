sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/Filter',
    "sap/m/Table",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function(Controller, Filter, Table, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("yulia.olhovik.controller.OrdersOverview", {

        /**
         * Called when the OrdersOverview controller is instantiated.
         * @public
         */
        onInit: function() {

            // create a "ordersfilterView" model to serve some technical/configuration stuff locally on the view
            var oOrdersFilterModel = new JSONModel({
                ordersCount: 0,
                pending: 0,
                accepted: 0
            });

            // save view model to the controller's instance
            this.oOrdersFilterModel = oOrdersFilterModel;

            // set model to the view with name "ordersfilterView"
            this.getView().setModel(oOrdersFilterModel, "ordersfilterView");

            // Create an object of filters
            this._mFilters = {
                "pending": [new Filter("summary/status", "EQ", "'pending'")],
                "accepted": [new Filter("summary/status", "EQ", "'accepted'")]
            };

        },

        /**
         * "Open dialog" button press event handler.
         */
        onCreateOrderPress: function() {
            var oView = this.getView();
            var oODataModel = oView.getModel("odata");

            // if the dialog was not created before, then create it (lazy loading)
            if (!this.oDialog) {

                this.oDialog = sap.ui.xmlfragment(oView.getId(), "yulia.olhovik.view.fragments.CreateOrderDialog", this);
                oView.addDependent(this.oDialog);
            }

            var oEntryCtx = oODataModel.createEntry("/Orders", {
                properties: {
                    summary: {},
                    shipTo: {},
                    customerInfo: {}
                }

            });
            // set context to the dialog
            this.oDialog.setBindingContext(oEntryCtx);

            // set default model to allow relative binding without a need to specify model's name
            this.oDialog.setModel(oODataModel);

            // open the dialog
            this.oDialog.open();
        },

        /**
         * Dialog "Create" button press event handler.
         */
        onCreateOrder: function() {
            var oODataModel = this.getView().getModel("odata");

            // call the method to "release" the changes from queue
            oODataModel.submitChanges();

            this.oDialog.close();
        },

        /**
         * "Cancel" button press event handler (in the dialog).
         */
        onDialogCancelPress: function() {
            var oODataModel = this.getView().getModel("odata");

            var oCtx = this.oDialog.getBindingContext("odata");

            // delete the entry from requests queue
            oODataModel.deleteCreatedEntry(oCtx);

            this.oDialog.close();
        },


        /*
         * "Delete" order button press event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object
         */
        onDeleteOrderPress: function(oEvent) {

            var oODataModel = this.getView().getModel("odata");
            var oList = oEvent.getSource(),
                oItem = oEvent.getParameter("listItem"),
                sPath = oItem.getBindingContext("odata").getPath();

            // after deletion put the focus back to the list
            oList.attachEventOnce("updateFinished", oList.focus, oList);

            // send a delete request to the odata service
            oODataModel.remove(sPath);
        },

        /**
         * "View" after rendering lifecycle method
         */
        onAfterRendering: function() {
            var oProductsTable = this.byId("orderTable");
            var oItemsBinding = oProductsTable.getBinding("items");

            var oView = this.getView();
            var oODataModel = oView.getModel("odata"),
                oViewModel = this.oOrdersFilterModel;

            oItemsBinding.attachDataReceived(function(oEvent) {

                // Get the count for all the products and set the value to 'ordersCount' property
                oODataModel.read("/Orders/$count", {
                    success: function(oData) {
                        oViewModel.setProperty("/ordersCount", oData);
                    }
                });

                // read the count for the accepted filter
                oODataModel.read("/Orders/$count", {
                    success: function(oData) {
                        oViewModel.setProperty("/accepted", oData);
                    },
                    filters: this._mFilters.accepted
                });

                // read the count for the pending filter
                oODataModel.read("/Orders/$count", {
                    success: function(oData) {
                        oViewModel.setProperty("/pending", oData);
                    },
                    filters: this._mFilters.pending
                });

            }, this);
        },

        /*
         * States iconTabBar select press event handler.
         */
        handleStatesIconTabBarSelect: function(oEvent) {
            var oList = this.getView().byId("orderTable");
            var oBinding = oList.getBinding("items"),
                sKey = oEvent.getParameter("key"),
                oFilter;
            if (sKey === "pending") {
                oFilter = new Filter("summary/status", "EQ", "'pending'");
                oBinding.filter([oFilter]);
            } else if (sKey === "accepted") {
                oFilter = new Filter("summary/status", "EQ", "'accepted'");
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },


        /**
         * Open OrdersDetails page press event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onOpenOrderDetailsPagePress: function(oEvent) {
            // get the source control of event object
            var oSource = oEvent.getSource();

            // get the binding context of a button 
            var oCtx = oSource.getBindingContext("odata");

            var oComponent = this.getOwnerComponent();

            // get the router object and call "navTo" method to redirect user to the 2nd page, passing the mandatory
            // parameter "OrderID"
            oComponent.getRouter().navTo("OrdersDetails", {
                OrderID: oCtx.getObject().id
            });
        },

        /**
         * Formatter for the "createdAt" and "shippedAt" date.
         *
         * @param {string} sDate ISO date string.
         *
         * @returns {string} new date's view.
         */
        ISODateFormatter: function(sDate) {
            var dDate = new Date(sDate),
                sFormatDate;

            if (dDate.getUTCMonth() < 12) {
                sFormatDate = dDate.getUTCDate() + ".0" + dDate.getUTCMonth() + "." + dDate.getUTCFullYear();
            }
            sFormatDate = dDate.getUTCDate() + "." + dDate.getUTCMonth() + "." + dDate.getUTCFullYear();

            var aDates = sFormatDate.split('.'),
                n = 12,
                aMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            for (var i = 0; i < n; i++) {
                if (aDates[1] == i) {
                    aDates[1] = aMonth[i];
                }
            }

            return aDates[1] + " " + aDates[0] + ", " + aDates[2];
        }
    });

});