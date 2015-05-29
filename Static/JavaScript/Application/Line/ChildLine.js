/*global app,Class,Line,s,ChildLine,$*/
(function () {
    "use strict";
    var ChildLineTemplate = {
        // constructor
        init: function (idea, previousLine) {
            this._super(idea, previousLine);
            this.highlightTimeout = null;
            this.delayUpdateIdea = null;
            this.isSelected = false;
        },
        insertElement: function (previousLine) {
            var HTML = this.getHTML();
            $(HTML).insertAfter(previousLine.getElement());
        },
        getHTML: function () {
            var id = this.idea.id,
                content = this.idea.getContent(),
                nrOfChildren = this.idea.getNumberOfChildren(),
                toReturn = "";

            function getTextarea() {
                return "<textarea spellcheck='false' class='idea-textarea' id='textarea' data-id='" + id + "' >" + content + "</textarea>";
            }

            function getID() {
                return "<div class='idea-id' style='display:none' id='id'>" + id + " </div>";
            }

            function getNumberOfChildren() {
                return "<div class='numberOfChildren' style='display:none' id='childrennr'>" + nrOfChildren + "&nbsp;</div>";
            }
            toReturn += "<div id='element-" + id + "' class='idea-div'> ";
            toReturn += "<div class='warning' id='warning'></div>";
            // toReturn += "<div class='problem' id='problem'></div>";
            toReturn += "<div class='content' id='content'>";
            toReturn += getID();
            toReturn += getNumberOfChildren();
            toReturn += getTextarea();
            toReturn += "</div>";
            toReturn += "</div>";
            return toReturn;
        },
        activateListeners: function () {
            this.activateKeyListenes();
            this.activateMouseListeners();
        },
        getElements: function () {
            this._super();
            this.textarea = this.getElement().children("#content").children("#textarea");
        },
        getTextarea: function () {
            return this.textarea;
        },
        activateKeyListenes: function () {
            var idea = this.idea,
                editor = idea.getEditor();
            this.textarea.on("keydown", function (event) {
                var keyCode = event.keyCode || event.which;
                if (app.data.isSpecialKey(keyCode)) {
                    event.preventDefault();
                }
                switch (keyCode) {
                    case app.data.keys.ENTER.code:
                        if (event.shiftKey) {
                            var position = idea.getLine().getTextarea().prop("selectionStart"),
                                newText = idea.getContent().insertAt(position, "\n");
                            idea.getLine().textarea.val(newText);
                            idea.getLine().select(position + 1, position + 1);
                        } else {
                            editor.fired_enterKeyPressed(idea);
                        }
                        idea.update();
                        break;
                    case app.data.keys.TAB.code:
                        if (event.shiftKey) {
                            idea.fired_shiftTabKeyPressed();
                        } else {
                            idea.fired_tabKeyPressed();
                        }
                        break;
                    case app.data.keys.BACKSPACE.code:
                        editor.removeIdea(idea, event);
                        break;
                    case app.data.keys["ARROW-UP"].code:
                        var line = idea.getLine(),
                            textarea = line.textarea;
                        line.cursorPosition = textarea.prop("selectionStart");
                        break;
                    case app.data.keys["ARROW-DOWN"].code:
                        var line = idea.getLine(),
                            textarea = line.textarea;
                        line.cursorPosition = textarea.prop("selectionStart");
                }
            });
            this.textarea.on("keyup", function (event) {
                var line = idea.getLine(),
                    textarea = line.textarea,
                    content = textarea.val(),
                    keyCode = event.keyCode || event.which,
                    currentPosition = textarea.prop("selectionStart");
                idea.setContent(content);
                idea.updateLine();
                // check the keys
                switch (keyCode) {
                    case app.data.keys["ARROW-UP"].code:
                        if (currentPosition === 0) {
                            editor.moveUp();
                            return false;
                        }
                    case app.data.keys["ARROW-DOWN"].code:
                        if (currentPosition === (idea.getContent().length)) {
                            editor.moveDown();
                            return false;
                        }
                        break;
                }
                if (app.data.isModyfingKey(keyCode)) {
                    line.delayUpdate();
                }
            });
        },
        delayUpdate: function () {
            var idea = this.getIdea(),
                editor = idea.getEditor();
            this.removeUpdateDelay();
            editor.addIdeaToWaitingList(idea);
            this.updateDelay = setTimeout(function () {
                idea.update();
            }, 500);
        },
        removeUpdateDelay: function () {
            var idea = this.getIdea(),
                editor = idea.getEditor();
            clearTimeout(this.updateDelay);
            editor.removeFromWaitingList(idea);
        },
        activateMouseListeners: function () {
            var idea = this.getIdea(),
                editor = idea.getEditor();
            this.textarea.on("click", function () {
                editor.setCurrentIdea(idea, idea.getLine().getTextarea().prop("selectionStart"), idea.getLine().getTextarea().prop("selectionEnd"));
            });
        },
        select: function (cursorPosition, cursorPositionEnds) {
            this.isSelected = true;
            setCaretToPos(this.textarea[0], cursorPosition, cursorPositionEnds);
            this.updateTextarea();
        },
        deselect: function () {
            this.isSelected = false;
            this.textarea.removeClass("current-textarea");
            this.getIdea().getParent().fired_childRealeased();
        },
        boldText: function () {
            this.textarea.addClass("parent-focused");
        },
        unboldText: function () {
            this.textarea.removeClass("parent-focused");
        },
        highLight: function () {
            clearTimeout(this.highlightTimeout);
            var element = this.textarea,
                oldColor = element.css("background"),
                x = 400;
            element.css({
                "background": "rgb(255, 253, 70)"
            });
            this.highlightTimeout = setTimeout(function () {
                element.css({
                    "background": oldColor
                });
            }, x);
        },
        update: function () {
            this.updateHTML();
            this.updateWarning();
            this.updateCorrelation();
            if (this.isSelected) {
                this.updateTextarea();
            }
        },
        updateHTML: function () {
            var levelWidth = 20,
                level = parseInt(this.idea.getLevel(), 10) - 1,
                margin = levelWidth * level,
                numberOfChildren = this.idea.getNumberOfChildren();
            // update the level
            this.element.children("#content").css({
                marginLeft: margin + "px"
            });
            // check warnings
            this.element.children("#content").children("#childrennr").html(numberOfChildren);
        },
        updateWarning: function () {
            var content = this.idea.getContent();
            if (this.getIdea().isParent() && content.length === 0) {
                this.showWarning("Randul este parinte si nu contine nimic");
            } else {
                this.hideWarning();
            }
        },
        showProblem: function (message) {
            var problem = this.element.children("#problem");
            problem.html('<img src="Static/Images/problem.png" alt="Atentie" title="' + message + '">');
        },
        hideProblem: function () {
            var problem = this.element.children("#problem");
            problem.html('');
        },
        showWarning: function (message) {
            var atentie = this.element.children("#warning");
            atentie.html('<img src="Static/Images/warning.png" alt="Atentie" title="' + message + '">');
        },
        hideWarning: function () {
            var atentie = this.element.children("#warning");
            atentie.html('');
        },
        getPreviousLine: function () {
            return this.getIdea().getParent().getLine();
        },
        updateCorrelation: function () {
            var idea = this.getIdea();
            if (idea.isCorrelatedToServer()) {
                this.textarea.css({
                    color: "rgb(87, 237, 87)"
                });
            } else {
                this.textarea.css({
                    color: "black"
                });
            }
        },
        hideShadow: function () {
            this.textarea.removeClass("current-textarea");
        },
        showShadow: function () {
            this.textarea.addClass("current-textarea");
        },
        updateTextarea: function () {
            var idea = this.getIdea(),
                content = idea.getContent(),
                matches = content.match(/\n/g),
                breaks = matches ? matches.length : 0,
                height = (breaks + 1) * 24;
            this.textarea.css({
                'height': height + "px"
            });
            if (breaks > 0) {
                this.showShadow();
            } else {
                this.hideShadow();
            }
        },
        remove: function () {
            this._super();
            this.removeUpdateDelay();
        }
    };
    ChildLine = Line.extend(ChildLineTemplate);
}($));