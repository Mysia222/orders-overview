sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function(Controller, History) {
    "use strict";
    return Controller.extend("yulia.olhovik.controller.ProductDetails", {

        /**
         * Controller's "init" lifecycle method.
         */
        onInit: function() {
            var oComponent = this.getOwnerComponent();

            var oRouter = oComponent.getRouter();

            // get the route object from router attach event handler, that will be called once the URL will match
            // the pattern of a route
            oRouter.getRoute("ProductsDetails").attachPatternMatched(this.onPatternMatched, this);
        },

        /**
         * "ProductsDetails" route pattern matched event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onPatternMatched: function(oEvent) {
            var oView = this.getView();
            // store the link to "this"
            var that = this;
            // get the route arguments from the event parameters
            var mRouteArguments = oEvent.getParameter("arguments");

            // get the "ProductID" parameter from arguments
            var sProductID = mRouteArguments.ProductID;

            // get the ODataModel
            var oODataModel = this.getView().getModel("odata");

            // wait until the metadata has been loaded. "metadataLoaded" method returns a promise
            oODataModel.metadataLoaded().then(function() {

                var oView = that.getView();
                var oVBox = oView.byId("feedBackBox");

                var oEntryCtx = oODataModel.createEntry("/ProductComments", {
                    properties: {
                        productId: sProductID
                    }
                });
                // set context to the dialog
                oVBox.setBindingContext(oEntryCtx);

                // set default model to allow relative binding without a need to specify model's name
                oVBox.setModel(oODataModel);

                // create an existent entity key
                var sKey = oODataModel.createKey("/OrderProducts", { id: sProductID });

                // bind the whole view to product's key
                that.getView().bindObject({
                    path: sKey,
                    model: "odata"
                });
            });

        },

        /**
         *  The post button event handler.
         *
         * @param {sap.ui.base.Event} oEvent event object.
         */

        onPostComment: function(oEvent) {

            var oODataModel = this.getView().getModel("odata");

            // call the method to "release" the changes from queue
            oODataModel.submitChanges();

        },


        onNavBack: function() {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("OrdersDetails", {}, true);
            }
        }
    });
});