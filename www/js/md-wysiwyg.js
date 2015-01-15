;(function($, window, document, undefined) {

    // Create the defaults once
    var pluginName = "markdownwysiwyg",
        defaults = {
            selectors: {
                outputWrapper: '#html-output',
                inputTextarea: '#md-input',
                inputButtons: '#input-btns'
            }
        },
        // markdown element definitions (atx-styled headers only)
        mdElements = {
            // regex for block elements
            block: {
                h6: /^######/,
                h5: /^#####/,
                h4: /^####/,
                h3: /^###/,
                h2: /^##/,
                h1: /^#/,
                hr: /^\*\*\*|---/,
                ul: /^[-\*+]/,
                ol: /^[1-9]\./,
                quote: /^>/,
                codeBlock: /^\t/
            },
            // regex for span elements
            span: {
                strong: /\*\*([^\*]+)\*\*|__([^_]+)__/,
                em: /\*([^\*]+)\*|_([^_]+)_/,
                code: /``([^`]+)``/,
                img: /!\[([^\[\]]*)\] ?\(([^\(\)]*)\)/,
                a: /\[([^\[\]]*)\] ?\(([^\(\)]*)\)/
            },
            html: {
                h1: $('<h1/>'),
                h2: $('<h2/>'),
                h3: $('<h3/>'),
                h4: $('<h4/>'),
                h5: $('<h5/>'),
                h6: $('<h6/>'),
                p: $('<p/>'),
                ul: $('<ul/>'),
                ol: $('<ol/>'),
                li: $('<li/>'),
                quote: $('<blockquote/>'),
                codeBlock: $('<pre/>'),
                hr: $('<hr/>'),
                em: $('<em/>'),
                strong: $('<strong/>'),
                code: $('<code/>'),
                img: $('<img/>'),
                a: $('<a/>')
            }
        },
        mdButtons = {
            h6: "######",
            h5: "#####",
            h4: "####",
            h3: "###",
            h2: "##",
            h1: "#",
            hr: "---",
            ul: "-",
            ol: "1.",
            quote: ">",
            codeBlock: "\t"
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function() {

            // vars for comfortable access on dom elements
            this.$inputTextarea = $(this.settings.selectors.inputTextarea, this.element);
            this.$inputButtons = $(this.settings.selectors.inputButtons, this.element);
            this.$outputWrapper = $(this.settings.selectors.outputWrapper, this.element);

            this.bindEvents();
            this.focusTextarea();
        },

        bindEvents: function() {
            var self = this;

            // bind events on dom elements
            this.$inputTextarea.on('keyup', function() {
                self.parseInput();
            });

            // handle tab indent in textarea
            this.$inputTextarea.on('keydown', function(e) {
                if (e.keyCode === 9) {
                    // get caret position/selection
                    var start = this.selectionStart;
                    var end = this.selectionEnd;

                    var $this = $(this);
                    var value = $this.val();

                    // set textarea value to: text before caret + tab + text after caret
                    $this.val(value.substring(0, start) + '\t' + value.substring(end));

                    // put caret at right position again (add one for the tab)
                    this.selectionStart = this.selectionEnd = start + 1;

                    // prevent the focus lose
                    e.preventDefault();
                }
            });

            this.$inputButtons.on('click', '.input-btn', function() {
                self.focusTextarea();
                self.insertMarkdownTag(this.getAttribute('id').split('-')[1]);
            });
        },

        focusTextarea: function() {
            this.$inputTextarea.focus();
        },

        parseInput: function() {
            // init local vars
            var input = this.$inputTextarea.val(),
                lines = input.split('\n'),
                output = [],
                lineTypeParsed,
                lastLineType = null,
                lineContent,
                spanElement,
                lineContainsSpan,
                currentContainer = null,
                self = this;

            // clear html output
            self.$outputWrapper.html("");

            $.each(lines, function(lineNumber, line) {
                lineTypeParsed = false;

                // skip empty lines
                if ($.trim(line).length < 1) {
                    return true;
                }

                // parse span elements
                do {
                    lineContainsSpan = false;

                    // test every span element regex
                    $.each(mdElements.span, function (key, regex) {
                        if (line.search(regex) !== -1) {
                            var res = line.match(regex);

                            // handle anchors
                            if (key === 'a') {
                                spanElement = mdElements.html[key].clone().html(res[1]).attr('href', res[2]);

                            // handle images
                            } else if (key === 'img') {
                                spanElement = mdElements.html[key].clone().attr('alt', res[1]).attr('src', res[2]);

                            // handle strong, em, code etc.
                            } else {
                                var content = res[1] === undefined ? res[2] : res[1];
                                spanElement = mdElements.html[key].clone().html(content);
                            }

                            // set html tag for parsed span element
                            line = $.trim(line.replace(regex, spanElement[0].outerHTML));
                            lineContainsSpan = true;
                            return false;
                        }
                    });

                } while (lineContainsSpan);

                // parse block elements
                $.each(mdElements.block, function(key, regex) {

                    // test block element regex
                    if (line.search(regex) !== -1) {
                        lineContent = $.trim(line.replace(regex, ''));

                        // close current container element if new element type is recognized
                        if ($.inArray(lastLineType, ['ul', 'ol', 'quote', 'codeBlock']) !== -1 && key !== lastLineType) {
                            currentContainer = null;
                        }

                        // handle lists
                        if (key === 'ul' || key === 'ol') {
                            if (currentContainer === null) {
                                // open new parent container
                                currentContainer = mdElements.html[key].clone();
                            }
                            currentContainer.append(mdElements.html['li'].clone().html(lineContent));
                            output.push(currentContainer);

                        // handle quotes and code blocks
                        } else if (key === 'quote' || key === 'codeBlock') {
                            if (currentContainer === null) {
                                // open new parent container
                                currentContainer = mdElements.html[key].clone();
                            }
                            currentContainer.append(lineContent+'<br/>');
                            output.push(currentContainer);

                        // handle headings and horizontal lines
                        } else {
                            output.push(mdElements.html[key].clone().html(lineContent));
                        }

                        lineTypeParsed = true;
                        lastLineType = key;

                        // finish line after first match
                        return false;
                    }
                });

                // handle paragraphs (no markdown tag)
                if (!lineTypeParsed) {

                    if (currentContainer !== null) {
                        currentContainer = null;
                    }

                    output.push(mdElements.html['p'].clone().html($.trim(line)));
                    lastLineType = 'p';
                }
            });

            // print output
            $.each(output, function(index, value) {
                self.$outputWrapper.append(value);
            });
        },

        insertMarkdownTag: function(btnId) {
            var start = this.$inputTextarea[0].selectionStart,
                value = this.$inputTextarea.val(),
                currentLine = value.substr(0, start).split('\n').length,
                lines = value.split('\n'),
                output = "",
                caretPositionDifference = 0;

            for (var i = 0; i < lines.length; i++) {
                if (i == currentLine - 1) {

                    // calc. caret positioning after tag insertion
                    caretPositionDifference = mdButtons[btnId].length + 1;

                    // remove old markdown tag (if necessary)
                    $.each(mdButtons, function(key, value) {
                        if (lines[i].search(value) !== -1) {
                            lines[i] = $.trim(lines[i].replace(value, ''));
                            caretPositionDifference -= value.length + 1;
                        }
                    });

                    // insert new markdown tag
                    output += mdButtons[btnId]+' ';
                }
                output += lines[i]+'\n';
            }
            this.$inputTextarea.val(output);
            this.parseInput();

            // put caret at right position again
            this.$inputTextarea[0].selectionStart = this.$inputTextarea[0].selectionEnd = start + caretPositionDifference;
        }

    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function(options) {
        this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });

        return this;
    };

})(jQuery, window, document);