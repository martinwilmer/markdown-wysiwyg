;(function($, window, document, undefined) {

    // Create the defaults once
    var pluginName = "markdownwysiwyg",
        defaults = {
            selectors: {
                menuWrapper: '#menu',
                inputWrapper: '#input',
                outputWrapper: '#output',
                htmlOutput: '#html-output',
                inputTextarea: '#md-input',
                inputButtons: '#input-btns',
                exportButtons: '#export-btns'
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
                hr: /^\*\*\*\**|- ?- ?--*/,
                ul: /^([\t]*)[-\*+]/,
                ol: /^([\t]*)[1-9]\./,
                quote: /^>/,
                codeBlock: /^\t/
            },
            // regex for span elements
            span: {
                strong: /\*\*([^\*]+)\*\*|__([^_]+)__/,
                em: /\*([^\*]+)\*|_([^_]+)_/,
                code: /``([^`]+)``/,
                img: /!\[([^\[\]]*)\] ?\(([^\(\)]*)\)/,
                a: /\[([^\[\]]*)\] ?\(([^"\(\) ]*)( "([^"\(\)]*)")?\)/,
                br: / {2,}/
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
                hr: $('<hr>'),
                em: $('<em/>'),
                strong: $('<strong/>'),
                code: $('<code/>'),
                img: $('<img/>'),
                a: $('<a/>'),
                br: $('<br>')
            }
        },
        mdButtons = {
            position: {
                h6: "######",
                h5: "#####",
                h4: "####",
                h3: "###",
                h2: "##",
                h1: "#",
                hr: "---\n",
                ul: "-",
                ol: "1.",
                quote: ">",
                codeBlock: "\t",
                img: "![alternativ text](/path/to/image)",
                a: "[anchor name](https://url.com)",
            },
            selection: {
                strong: "**",
                em: "*",
                mono: "``"
            }
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
            this.$exportButtons = $(this.settings.selectors.exportButtons, this.element);
            this.$htmlOutput = $(this.settings.selectors.htmlOutput, this.element);
            this.$menuWrapper = $(this.settings.selectors.menuWrapper, this.element);
            this.$inputWrapper = $(this.settings.selectors.inputWrapper, this.element);
            this.$outputWrapper = $(this.settings.selectors.outputWrapper, this.element);

            this.bindEvents();
            this.resizePlugin();
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

            $(window).on('resize', function() {
                self.resizePlugin();
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
                lineMatch,
                key,
                nestedLevel,
                spanElement,
                lineContainsSpan,
                currentContainer = null,
                currentNestedContainer = null,
                self = this;

            // clear html output
            self.$htmlOutput.html("");

            $.each(lines, function(lineNumber, line) {
                lineTypeParsed = false;

                // handle empty lines
                if ($.trim(line).length < 1) {
                    currentContainer = null;
                    currentNestedContainer = null;
                    lastLineType = null;
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
                                if (res[4] !== undefined) {
                                    spanElement.attr('title', $.trim(res[4]));
                                }

                            // handle images
                            } else if (key === 'img') {
                                spanElement = mdElements.html[key].clone().attr('alt', res[1]).attr('src', res[2]);

                            } else if (key === 'br') {
                                spanElement = mdElements.html[key].clone();

                            // handle strong, em, code
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

                    // match block element regex
                    if (line.search(regex) !== -1) {
                        lineContent = line.replace(regex, '');
                        //lineContent = $.trim(line.replace(regex, ''));

                        // push current container element if new element type is recognized
                        if ($.inArray(lastLineType, ['p', 'ul', 'ol', 'quote', 'codeBlock']) !== -1 && key !== lastLineType) {
                            currentContainer = null;
                            currentNestedContainer = null;
                        }

                        // handle lists
                        if (key === 'ul' || key === 'ol') {
                            //nestedLevel = 0;

                            // check if list element is nested
                            lineMatch = regex.exec(line);
                            if (lineMatch[1].length > 0 && currentContainer !== null) {
                                //nestedLevel = lineMatch[1].length;

                                if (currentNestedContainer === null) {
                                    // this is a list style type hack because the opened list element is empty
                                    // doesnt work properly for ordered lists
                                    currentNestedContainer = mdElements.html['li'].clone().css('list-style-type', 'none').append(mdElements.html[key].clone());

                                }
                                currentNestedContainer.children(key).append(mdElements.html['li'].clone().html(lineContent));
                                lineContent = currentNestedContainer;

                            // bottom level list element
                            } else {
                                currentNestedContainer = null;

                                if (currentContainer === null) {
                                    // open new parent container
                                    currentContainer = mdElements.html[key].clone();
                                }

                                lineContent = mdElements.html['li'].clone().html(lineContent);
                            }

                            currentContainer.append(lineContent);

                            output.push(currentContainer);

                        // handle quotes and code blocks
                        } else if (key === 'quote' || key === 'codeBlock') {
                            if (currentContainer === null) {
                                // open new parent container
                                currentContainer = mdElements.html[key].clone();
                            }

                            // add line breaks to code blocks
                            lineContent = key === 'codeBlock' ? lineContent + '\n': lineContent + ' ';

                            currentContainer.html(currentContainer.html() + lineContent);
                            output.push(currentContainer);

                        // handle horizontal lines
                        } else if (key === 'hr') {
                            output.push(mdElements.html[key].clone());

                        // handle headings
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
                    key = 'p';

                    if (lastLineType !== key) {
                        currentContainer = mdElements.html[key].clone();
                    }

                    currentContainer.html(currentContainer.html() + $.trim(line) + ' ');
                    output.push(currentContainer);
                    lastLineType = key;
                }
            });

            // print output
            $.each(output, function(index, value) {
                self.$htmlOutput.append(value);
            });
        },

        insertMarkdownTag: function(btnId) {
            var start = this.$inputTextarea[0].selectionStart,
                end = this.$inputTextarea[0].selectionEnd,
                value = this.$inputTextarea.val(),
                currentLine = value.substr(0, start).split('\n').length,
                lines = value.split('\n'),
                output = "",
                lineStartCharNum = 0,
                caretPositionDifference = 0;

            for (var i = 0; i < lines.length; i++) {
                if (i == currentLine - 1) {
                    if ($.inArray(btnId, ['strong', 'em', 'mono']) !== -1) {
                        lines[i] = lines[i].substr(0,start - lineStartCharNum) + mdButtons.selection[btnId] +
                            lines[i].substr(start - lineStartCharNum,end-start) + mdButtons.selection[btnId] +
                            lines[i].substr(end-lineStartCharNum);
                        caretPositionDifference = mdButtons.selection[btnId].length + end-start;

                    } else {
                        // calc. caret positioning after tag insertion
                        caretPositionDifference = mdButtons.position[btnId].length + 1;

                        // remove old markdown tag (if necessary)
                        $.each(mdButtons.position, function(key, value) {
                            if (lines[i].search(value) !== -1) {
                                lines[i] = $.trim(lines[i].replace(value, ''));
                                caretPositionDifference -= value.length + 1;
                            }
                        });

                        // insert new markdown tag
                        output += mdButtons.position[btnId]+' ';
                    }
                }
                output += lines[i] + '\n';
                lineStartCharNum += lines[i].length + 1;
            }
            this.$inputTextarea.val(output);
            this.parseInput();

            // put caret at right position again
            this.$inputTextarea[0].selectionStart = this.$inputTextarea[0].selectionEnd = start + caretPositionDifference;
        },

        resizePlugin: function() {
            var $form = this.$inputTextarea.parent(),
                menuHeight = this.$menuWrapper.is(':visible') ? this.$menuWrapper.outerHeight() : 0,
                inputHeight = this.$element.outerHeight() - menuHeight,
                inputButtonsHeight = this.$inputButtons.outerHeight(),
                inputFormHeight = inputHeight -
                    inputButtonsHeight,
                inputTextareaHeight = inputFormHeight -
                    parseInt(this.$inputTextarea.css('padding-top')) -
                    parseInt(this.$inputTextarea.css('padding-bottom')),
                inputTextareaWidth = this.$inputWrapper.outerWidth() -
                    parseInt(this.$inputTextarea.css('padding-left')) -
                    parseInt(this.$inputTextarea.css('padding-right')),
                htmlOutputHeight = inputHeight -
                    inputButtonsHeight -
                    parseInt(this.$htmlOutput.css('padding-top')) -
                    parseInt(this.$htmlOutput.css('padding-bottom'));

            this.$inputWrapper.height(inputHeight);
            $form.height(inputFormHeight);
            this.$inputTextarea.width(inputTextareaWidth).height(inputTextareaHeight);

            this.$outputWrapper.height(inputHeight);
            this.$exportButtons.height(inputButtonsHeight);
            this.$htmlOutput.height(htmlOutputHeight);
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