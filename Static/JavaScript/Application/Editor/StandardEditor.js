/*global Editor,app,Data*/
(function () {
    "use strict";
    var StandardEditorTemplate = {
        init: function (id, container) {
            this._super(id, container, "Standard");
        },
        getDataFromServer: function (id) {
            var editor = this;
            this.container.html("Please wait to load...");
            app.gateway.getEntireIdea(id, function (data) {
                editor.loadData(Data.prepare(data));
            });
        },
        loadData: function (data) {
            var firstIdea = null,
                firstChild = null;
            this.createHomeIdea({
                id: data.id,
                content: data.content,
                parent: data.parent
            });
            if (data.children.length !== 0) {
                // get the first one
                firstChild = data.children[0];
                firstIdea = this.loadFirstIdea(firstChild);
                // remove the first one
                data.children.splice(0, 1);
                // load children
                this.loadIdeas(this.home, data.children);
                // punem restul de copii 
            } else {
                firstIdea = this.createNewFirstChildIdea();
            }
            this.setCurrentIdea(firstIdea, "END");
        }
    };
    StandardEditor = Editor.extend(StandardEditorTemplate);
}());