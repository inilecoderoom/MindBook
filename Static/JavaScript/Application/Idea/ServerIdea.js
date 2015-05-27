/*global app,Class,Idea,ChildLine,$*/
(function () {
    "use strict";
    ServerIdea = function ServerIdea(localIdea) {
        this.localIdea = localIdea;
        this.serverId = null;
        this.correlatedId = null;
    };
    ServerIdea.prototype = {
        isOnServer: function () {
            return (this.serverId !== null);
        },
        /**
         * It checks if the idea is on the server. If not, it addes it
         */
        addIdea: function () {
            if(this.isOnServer()) {
                this.update();
            }
        },
        setId: function (serverId) {
            this.serverId = serverId;
        },
        getCorrelatedId: function () {
            return this.correlatedId;
        },
        isCorrelated: function () {
            return (this.correlatedId !== null);
        },
        setCorrelatedId: function (correlatedId) {
            this.correlatedId = correlatedId;
        },
        getId: function () {
            if (this.serverId) {
                return this.serverId;
            }
            return this.getLocalIdea().getId();
        },
        getLocalIdea: function () {
            return this.localIdea;
        },
        update: function () {
            var idea = this.getLocalIdea(),
                localId = idea.getId(),
                localParent = idea.getParent(),
                editor = idea.getEditor(),
                content = idea.getContent(),
                serverParentId = localParent.getServerIdea().getId(),
                childrenIDsArray = idea.getChildren();
            if (this.canIdeaBeUpdated()) {
                editor.updateIdeaOnServer({
                    id: localId,
                    content: content,
                    parent: serverParentId,
                    children: childrenIDsArray.toString()
                }, idea);
            }
        },
        canIdeaBeUpdated: function () {
            var idea = this.getLocalIdea(),
                content = idea.getContent();
            if (content.length !== 0) {
                return true;
            }
            if (this.isOnServer()) {
                return true;
            }
            if (idea.hasChildren()) {
                return true;
            }
            return false;
        }
    };
}());