sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel"
], function(Controller, History, JSONModel) {
    "use strict";
    return Controller.extend("yulia.olhovik.controller.OrdersDetails", {

        /**
         * Controller's "init" lifecycle method.
         */
        onInit: function() {
            var oComponent = this.getOwnerComponent();

            var oRouter = oComponent.getRouter();

            // get the route object from router attach event handler, that will be called once the URL will match
            // the pattern of a route
            oRouter.getRoute("OrdersDetails").attachPatternMatched(this.onPatternMatched, this);

            // create AppView JSON model
            this.oAppViewModel = new JSONModel({
                shipEdit: false,
                costumerEdit: false
            });

            this.getView().setModel(this.oAppViewModel, "appView");

        },

        /**
         * "OrdersDetails" route pattern matched event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onPatternMatched: function(oEvent) {

            // store the link to "this"
            var that = this;

            // get the route arguments from the event parameters
            var mRouteArguments = oEvent.getParameter("arguments");

            // get the "sOrderID" parameter from arguments
            var sOrderID = mRouteArguments.OrderID;

            // get the ODataModel instance form the view
            var oODataModel = this.getView().getModel("odata");

            // wait until the metadata has been loaded. "metadataLoaded" method returns a promise
            oODataModel.metadataLoaded().then(function() {

                // create an existent entity key, in order to be able to bind the view to it
                // this method takes the name of EntitySet (collection) and map of key parameters
                var sKey = oODataModel.createKey("/Orders", { id: sOrderID });

                // bind the whole view to supplier key (ODataModel will automatically request the data)
                that.getView().bindObject({
                    path: sKey,
                    model: "odata"
                });
            });

        },

        onNavBack: function() {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("OrdersOverview", {}, true);
            }
        },

        /**
         * Open ProductsDetails page press event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onOpenOrderProductPagePress: function(oEvent) {

            // get the source control of event object (the one that was fired event)
            var oSource = oEvent.getSource();

            // get the binding context of a button (it's a part of the table line, so it inherits the context of it)
            var oCtx = oSource.getBindingContext("odata");
            var oComponent = this.getOwnerComponent();

            // get the router object and call "navTo" method to redirect user to the 3nd page, passing the mandatory
            // parameter "ProductID"
            oComponent.getRouter().navTo("ProductsDetails", {
                ProductID: oCtx.getObject().id
            });
        },

        /**
         * Formatter for the "createdAt" and "shippedAt" date.
         * 
         * @param {string} sId Id string.
         *
         * @param {string} sDate ISO date string.
         *
         * @returns {string} icon name.
         */
        PageHeaderFormatter: function(sId, sDate) {
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
            var sFinallyDate = aDates[1] + " " + aDates[0] + ", " + aDates[2];

            return "Order (" + sId + "), from " + sFinallyDate;
        },



        /**
         * Edit button press event handler.
         */
        onEditShipToInfoPress: function(oEvent) {
            var sButtonsIds = oEvent.getSource().getId();

            if (sButtonsIds.indexOf("shipEditButton") !== -1) {
                this.oAppViewModel.setProperty("/shipEdit", true);
            }
            if (sButtonsIds.indexOf("costumerEditButton") !== -1) {
                this.oAppViewModel.setProperty("/costumerEdit", true);
            }
        },

        /**
         * Save button press event handler.
         */
        onSaveShipToInfoPress: function(oEvent) {
            var sButtonsIds = oEvent.getSource().getId();

            if (sButtonsIds.indexOf("shipSaveButton") !== -1) {
                this.oAppViewModel.setProperty("/shipEdit", false);
            }
            if (sButtonsIds.indexOf("costumerSaveButton") !== -1) {
                this.oAppViewModel.setProperty("/costumerEdit", false);
            }

            var oODataModel = this.getView().getModel("odata");

            // call the method to release the request queue
            oODataModel.submitChanges();
        },

        /**
         * Cancel button press event handler.
         */
        onCancelShipToInfoPress: function(oEvent) {
            var sButtonsIds = oEvent.getSource().getId();

            if (sButtonsIds.indexOf("shipCancelButton") !== -1) {
                this.oAppViewModel.setProperty("/shipEdit", false);
            }
            if (sButtonsIds.indexOf("costumerCancelButton") !== -1) {
                this.oAppViewModel.setProperty("/costumerEdit", false);
            }

            var oODataModel = this.getView().getModel("odata");

            // call the method to reset the request queue
            oODataModel.resetChanges();
        },

        /**
         * "Open dialog" button press event handler.
         */
        onCreateProductPress: function() {
            var oView = this.getView();
            var oODataModel = oView.getModel("odata");

            //get order's id
            var sPath = oView.mObjectBindingInfos.odata.path;
            var reg = /\((.+)\)/;
            var sId = sPath.match(reg)[1];

            // if the dialog was not created before, then create it (lazy loading)
            if (!this.oDialog) {

                this.oDialog = sap.ui.xmlfragment(oView.getId(), "yulia.olhovik.view.fragments.CreateProductDialog", this);
                // call the "addDependent" method in order to propagate all models and bindings from the view to
                // the controls from fragment
                oView.addDependent(this.oDialog);
            }

            // call "createEntry" method to create a context based on the entity type and add the "create" request to the request queue
            var oEntryCtx = oODataModel.createEntry("/OrderProducts", {
                properties: {
                    orderId: sId
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
        onCreateProduct: function() {
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
         * "Delete" product button press event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object
         */
        onDeleteProductPress: function(oEvent) {

            var oODataModel = this.getView().getModel("odata");
            var oList = oEvent.getSource(),
                oItem = oEvent.getParameter("listItem"),
                sPath = oItem.getBindingContext("odata").getPath();

            // after deletion put the focus back to the list
            oList.attachEventOnce("updateFinished", oList.focus, oList);

            // send a delete request to the odata service
            oODataModel.remove(sPath);
        },

    });

});