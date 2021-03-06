/*global $*/
(function () {
    'use strict';
    Data = function Data() {
        this.homeIdeaId = null;
        this.counter = null;
        this.incrementCounter = function () {
            this.counter = this.counter + 1;
        };
        this.getHomeIdeaId = function () {
            return this.homeIdeaId;
        };
        this.getCounter = function () {
            return this.counter;
        };
        this.keys = {
            "TAB": {
                code: 9,
                symbol: "\t",
                special: true,
                canModifyText: false
            },
            "ENTER": {
                code: 13,
                symbol: "\n",
                special: true,
                canModifyText: false
            },
            "ARROW-UP": {
                code: 38,
                special: false,
                canModifyText: false
            },
            "ARROW-DOWN": {
                code: 40,
                special: false,
                canModifyText: false
            },
            "BACKSPACE": {
                code: 8,
                special: false,
                canModifyText: true
            },
            "ARROW-LEFT": {
                code: 37,
                special: false,
                canModifyText: false
            },
            "ARROW-RIGHT": {
                code: 39,
                special: false,
                canModifyText: false
            },
            "ESC": {
                code: 27,
                special: false,
                canModifyText: false
            }
        };
    };
    Data.prototype = {
        isSpecialKey: function (keyCode) {
            var keyName = null,
                key = null;
            for (keyName in this.keys) {
                key = this.keys[keyName];
                if (key.code === keyCode && key.special === true) {
                    return true;
                }
            }
            return false;
        },
        isModyfingKey: function (keyCode) {
            var keyName = null,
                key = null;
            for (keyName in this.keys) {
                key = this.keys[keyName];
                if (key.code === keyCode && key.canModifyText === false) {
                    return false;
                }
            }
            return true;
        },
        getKey: function (name) {
            return this.keys[name];
        }
    };
    Data.htmlView = function (content, settings) {
        var inputText = replaceSearchedTerm(content, "\n", "<br />"),
            replacedText = "",
            replacePattern1 = null,
            replacePattern2 = null,
            replacePattern3 = null,
            settings = settings || {},
            replaceText = '<span class="link">$1</span>';
        //URLs starting with http://, https://, or ftp://
        replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        if (!settings.colour) {
            replaceText = '<a style="color:rgb(98, 87, 250);" href="$1" target="_blank">$1</a>';
        }
        replacedText = inputText.replace(replacePattern1, replaceText);
        //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        if (!settings.colour) {
            replaceText = '$1<a style="color: rgb(98, 87, 250);" href="http://$2" target="_blank">$2</a>';
        }
        replacedText = replacedText.replace(replacePattern2, replaceText);
        //Change email addresses to mailto:: links.
        replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
        if (!settings.colour) {
            replaceText = '<a style="color: rgb(98, 87, 250);" href="mailto:$1">$1</a>';
        }
        replacedText = replacedText.replace(replacePattern3, replaceText);
        return replacedText;
    };
    Data.prepare = function (data) {
        var temp = {
            id: 0 + parseInt(data.id, 10),
            parent: parseInt(data.parent, 10),
            content: data.content
        },
            i = 0,
            child = null,
            c = null,
            parent = null;
        temp.children = [];

        function findParentOfChild(current, id) {
            var current_child = null,
                iterator = null,
                found = null;
            if (current.id === id) {
                return current;
            }
            for (iterator = 0; iterator < current.children.length; iterator = iterator + 1) {
                current_child = current.children[iterator];
                found = findParentOfChild(current_child, id);
                if (found) {
                    return found;
                }
            }
            return null;
        }
        for (i = 0; i < data.children.length; i = i + 1) {
            c = data.children[i];
            child = {
                id: 0 + parseInt(c.id, 10),
                content: c.content,
                children: []
            };
            parent = findParentOfChild(temp, 0 + parseInt(c.parent, 10));
            if (!parent) {
                console.warn("Nu am gasit parinte pentru " + c.id + ". Trebuia sa fie parintele " + c.parent);
                console.warn("Toate datele:  ");
                console.warn(data);
                throw "Problem with pre-processing !";
            }
            parent.children.push(child);
            child.parent = parent;
        }
        return temp;
    };
}($));